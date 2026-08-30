import { chromium } from "playwright";

const baseUrl = process.env.QA_URL || "http://127.0.0.1:3000/";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] });

async function testViewport(name, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const search = page.locator('input[placeholder*="Search team"]');
  await search.waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".masthead__tools details.filter-menu").count() !== 1) throw new Error(`${name}: expected exactly one Filter control in the masthead`);
  if (await page.locator(".match-command-bar details.filter-menu").count() !== 0) throw new Error(`${name}: Filter control still appears in the calendar command bar`);

  await page.waitForTimeout(12_000);
  const initialSections = await page.locator("section.competition-section").count();
  const firstMatch = page.locator(".match-card").first();
  if (await firstMatch.count()) {
    await firstMatch.getByRole("button", { name: "Toggle match details" }).click();
    const diagnostic = firstMatch.locator(".diagnostic-line");
    if (await diagnostic.count()) {
      const diagnosticText = (await diagnostic.textContent()) || "";
      if (!diagnosticText.includes("Score:")) throw new Error(`${name}: diagnostics line rendered without score provenance`);
    }
  }
  const settingsButton = page.getByRole("button", { name: /Settings/ });
  if (await settingsButton.count()) {
    await settingsButton.click();
    const browseButton = page.getByRole("button", { name: /Browse competitions/ });
    if (await browseButton.count()) {
      await browseButton.click();
      await page.locator(".browse-league").first().waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
      const browseRows = page.locator(".browse-league");
      const browseMarks = page.locator(".browse-league__logo");
      if (await browseRows.count() > 0 && await browseMarks.count() !== await browseRows.count()) throw new Error(`${name}: a rendered Browse competition row is missing its mark`);
      const browseImages = page.locator(".browse-league__logo img");
      for (let imageIndex = 0; imageIndex < await browseImages.count(); imageIndex += 1) {
        const src = await browseImages.nth(imageIndex).getAttribute("src");
        if (src && (!src.includes("/leaguelogos/") || new RegExp("default-team-logo|/teamlogos/soccer/", "i").test(src))) {
          throw new Error(`${name}: Browse artwork used an invalid ESPN asset path: ${src}`);
        }
      }
      const premierBrowseRow = browseRows.filter({ hasText: "Premier League" }).first();
      if (await premierBrowseRow.count()) {
        const premierImage = premierBrowseRow.locator("img");
        if (await premierImage.count()) {
          const premierBrowseSrc = await premierImage.getAttribute("src");
          if (premierBrowseSrc !== "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png") throw new Error(`${name}: Premier League Browse logo URL mismatch: ${premierBrowseSrc}`);
        }
      }
      const browseImage = page.locator(".browse-league img").first();
      if (await browseImage.count()) {
        await browseImage.evaluate((image) => image.dispatchEvent(new Event("error")));
        if (await page.locator(".browse-league .competition-mark__fallback").count() === 0) throw new Error(`${name}: Browse broken artwork did not switch to an initials fallback`);
      }
      await page.getByRole("button", { name: "Done" }).click();
    }
    await page.getByRole("complementary", { name: "FootyScores Pro settings" }).getByRole("button", { name: "Close settings" }).click();
  }

  const searchTarget = initialSections > 0 ? (await page.locator(".fixture-team").first().innerText()).trim() : "Villarreal";
  await search.fill(searchTarget);
  await page.waitForTimeout(250);
  const searchedText = await page.locator("main").innerText();
  if (initialSections > 0) {
    if (!searchedText.includes(searchTarget)) throw new Error(`${name}: team search did not render the matching fixture`);
    if (await page.locator(".match-card").count() === 0) throw new Error(`${name}: team search removed all matching fixture cards`);
    if (await page.locator("section.competition-section").count() === 0) throw new Error(`${name}: matching competition section disappeared during search`);
    await search.fill(searchTarget.slice(0, Math.max(3, Math.min(searchTarget.length, 6))));
    await page.waitForTimeout(150);
    const selectedSuggestion = page.locator("button.match-search__suggestion").filter({ hasText: searchTarget }).first();
    if (await selectedSuggestion.count()) {
      await selectedSuggestion.click();
      await page.waitForTimeout(350);
      if (await page.locator("[data-competition-slug].competition-section--highlighted").count() === 0 && await page.locator(".match-card--highlighted").count() === 0) throw new Error(`${name}: suggestion selection did not highlight a destination`);
    }
  }

  await search.fill("zzzz-no-fixture");
  await page.waitForTimeout(250);
  const emptyText = await page.locator("main").innerText();
  if (initialSections > 0) {
    if (!emptyText.includes("No matches match")) {
      console.error(`${name} empty-state text:`, emptyText.slice(0, 800));
      throw new Error(`${name}: empty search did not show the no-match state`);
    }
  } else if (!emptyText.includes("ESPN did not return live score data")) {
    console.error(`${name} no-data text:`, emptyText.slice(0, 800));
    throw new Error(`${name}: no-data state was not rendered when ESPN returned no fixtures`);
  }
  if (await page.locator("section.competition-section").count() !== 0) throw new Error(`${name}: empty search left a competition section visible`);

  await search.fill("");
  await page.waitForTimeout(250);
  const filterMenu = page.locator("details.filter-menu");
  await filterMenu.locator("summary").click();
  const filterPanel = filterMenu.locator(".filter-menu__panel");
  if (!(await filterPanel.isVisible())) throw new Error(`${name}: Filter menu did not open`);
  const upcomingButton = filterPanel.locator("button").filter({ hasText: "Upcoming" }).first();
  await upcomingButton.click();
  await page.waitForTimeout(250);
  const upcomingSectionsText = await page.locator("section.competition-section").allInnerTexts();
  const filterLabel = await filterMenu.locator("summary").textContent();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('input[placeholder*="Search team"]').waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(500);
  const restoredFilterLabel = await page.locator("details.filter-menu summary").textContent();
  if (!restoredFilterLabel.includes("Upcoming")) throw new Error(`${name}: persisted Upcoming filter did not restore after reload`);
  if (!filterLabel.includes("Upcoming")) throw new Error(`${name}: active Filter label did not update to Upcoming`);
  const clearFilter = page.getByRole("button", { name: "Clear filter" });
  if (await clearFilter.count()) {
    await clearFilter.click();
    await page.waitForTimeout(200);
    const clearedLabel = await page.locator("details.filter-menu summary").textContent();
    if (!clearedLabel.includes("All")) throw new Error(`${name}: Clear filter did not restore the All view`);
    if (initialSections > 0 && await page.locator("section.competition-section").count() === 0) throw new Error(`${name}: Clear filter did not restore fixture sections`);
  }
  const mainTextAfterRecovery = await page.locator("main").innerText();
  if (mainTextAfterRecovery.includes("clear the filter, or")) throw new Error(`${name}: empty-state recovery copy is incomplete`);
  if (initialSections > 0) {
    if (await page.locator("section.competition-section .competition-title__mark").count() === 0) throw new Error(`${name}: fixture competition mark did not render`);
    const renderedCompetitionImages = page.locator("section.competition-section .competition-title__mark img");
    const renderedImageCount = await renderedCompetitionImages.count();
    for (let imageIndex = 0; imageIndex < renderedImageCount; imageIndex += 1) {
      const src = await renderedCompetitionImages.nth(imageIndex).getAttribute("src");
      if (src && !src.includes("/leaguelogos/")) throw new Error(`${name}: competition artwork used a non-league ESPN path: ${src}`);
    }
    const curatedLogoIds = ["23", "15", "10", "12", "9", "2", "2310", "2579", "4", "19", "2178", "1979"];
    const renderedSources = [];
    for (let imageIndex = 0; imageIndex < renderedImageCount; imageIndex += 1) renderedSources.push(await renderedCompetitionImages.nth(imageIndex).getAttribute("src"));
    const visibleCuratedSource = renderedSources.find((src) => src && curatedLogoIds.some((id) => src.endsWith(`/500/${id}.png`)));
    if (visibleCuratedSource && !visibleCuratedSource.includes("a.espncdn.com/i/leaguelogos/soccer/500/")) throw new Error(`${name}: curated competition did not use the ESPN league-logo CDN: ${visibleCuratedSource}`);
    const premierLedgerSection = page.locator("section.competition-section").filter({ hasText: "Premier League" }).first();
    if (await premierLedgerSection.count()) {
      const premierLedgerSrc = await premierLedgerSection.locator(".competition-title__mark img").getAttribute("src");
      if (premierLedgerSrc !== "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png") throw new Error(`${name}: Premier League Ledger logo URL mismatch: ${premierLedgerSrc}`);
    }
    const ledgerImage = page.locator("section.competition-section .competition-title__mark img").first();
    if (await ledgerImage.count()) {
      await ledgerImage.evaluate((image) => image.dispatchEvent(new Event("error")));
      if (await page.locator("section.competition-section .competition-mark__fallback").count() === 0) throw new Error(`${name}: ledger broken artwork did not switch to an initials fallback`);
    }
    const firstSectionText = await page.locator("section.competition-section").first().innerText();
    const renderedUpcomingText = upcomingSectionsText.join("\n");
    if (renderedUpcomingText.includes("FT-Pens") || renderedUpcomingText.includes("Finished")) throw new Error(`${name}: non-upcoming content remained after status filter`);
  }

  await page.close();
  return `${name}: top-bar search, empty state, Filter open, status switch, Browse artwork, and ${initialSections > 0 ? "rendered fixture filtering" : "control-only fallback (no fresh ESPN fixtures)"} passed`;
}

const results = [
  await testViewport("desktop", { width: 1280, height: 720 }),
  await testViewport("mobile", { width: 390, height: 844 }),
];
await browser.close();
  console.log(results.join("\n"));
