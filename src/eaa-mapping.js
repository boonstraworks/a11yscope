/**
 * EAA / EN 301 549 layer.
 *
 * This is what sets a11yscan apart from a plain axe-core runner: every
 * finding is linked to the European Accessibility Act via the harmonised
 * standard EN 301 549, and explained in plain Dutch.
 *
 * axe-core already tags each rule with the WCAG success criteria it covers
 * (e.g. "wcag111", "wcag143", "wcag412"). EN 301 549 clause 9 mirrors WCAG
 * one-to-one for web content, so WCAG 1.1.1 maps to EN 301 549 clause
 * 9.1.1.1. We derive the mapping from those tags instead of maintaining a
 * rule-by-rule table, which keeps it correct as axe-core evolves.
 */

/** Turn an axe "wcagNNN" tag into a success-criterion number like "1.1.1". */
function tagToSc(tag) {
  const m = /^wcag(\d{3,4})$/.exec(tag);
  if (!m) return null;
  const d = m[1];
  // first digit = principle, second = guideline, remainder = criterion
  return `${d[0]}.${d[1]}.${d.slice(2)}`;
}

/** Plain-Dutch explanation per success criterion (most common ones). */
const NL = {
  '1.1.1': 'Afbeeldingen en andere niet-tekstuele content hebben een tekstalternatief nodig, zodat schermlezers ze kunnen voorlezen.',
  '1.3.1': 'De structuur van de pagina (koppen, lijsten, tabellen, labels) moet ook in de code kloppen, niet alleen visueel.',
  '1.3.5': 'Invoervelden die om persoonlijke gegevens vragen, moeten hun doel kenbaar maken (autocomplete), zodat hulpsoftware kan helpen invullen.',
  '1.4.1': 'Informatie mag niet alleen met kleur worden overgebracht; denk aan foutmeldingen die enkel rood zijn.',
  '1.4.3': 'Tekst moet voldoende contrast hebben met de achtergrond (minimaal 4.5:1 voor normale tekst).',
  '1.4.4': 'Tekst moet tot 200% vergroot kunnen worden zonder verlies van inhoud of functie.',
  '1.4.10': 'De pagina moet bruikbaar blijven zonder horizontaal scrollen (reflow op mobiel/zoom).',
  '1.4.11': 'Knoppen, iconen en formuliergrenzen hebben voldoende contrast nodig (minimaal 3:1).',
  '1.4.12': 'De gebruiker moet regel-, letter- en woordafstand kunnen aanpassen zonder dat content wegvalt.',
  '2.1.1': 'Alle functionaliteit moet met het toetsenbord te bedienen zijn, niet alleen met de muis.',
  '2.4.1': 'Er moet een manier zijn om terugkerende blokken over te slaan (bijv. "ga naar hoofdinhoud").',
  '2.4.2': 'Elke pagina heeft een beschrijvende paginatitel nodig.',
  '2.4.4': 'De tekst van een link moet duidelijk maken waar hij naartoe gaat ("lees meer" is te vaag).',
  '2.4.6': 'Koppen en labels moeten beschrijvend zijn.',
  '2.4.7': 'Het element dat toetsenbordfocus heeft, moet zichtbaar zijn.',
  '2.5.8': 'Klik- en tikdoelen moeten groot genoeg zijn (minimaal 24×24 CSS-pixels).',
  '3.1.1': 'De taal van de pagina moet in de code staan (lang-attribuut), zodat schermlezers de juiste uitspraak kiezen.',
  '3.2.2': 'Het wijzigen van een invoerveld mag niet onverwacht de context veranderen.',
  '3.3.1': 'Invoerfouten moeten duidelijk worden gemeld en beschreven.',
  '3.3.2': 'Formuliervelden hebben zichtbare labels of instructies nodig.',
  '4.1.2': 'Interactieve elementen (knoppen, velden, widgets) moeten een correcte naam, rol en waarde hebben voor hulpsoftware.',
  '4.1.3': 'Statusmeldingen moeten door hulpsoftware kunnen worden opgepikt zonder focusverlies.',
};

const NL_FALLBACK =
  'Dit punt valt onder de toegankelijkheidseisen van EN 301 549. Zie de WCAG-uitleg voor de details en de aanbevolen oplossing.';

/**
 * Enrich each axe violation with WCAG success criteria, the matching
 * EN 301 549 clause(s) and a Dutch explanation.
 */
export function annotateViolations(violations) {
  return violations.map((v) => {
    const scs = [...new Set((v.tags || []).map(tagToSc).filter(Boolean))];
    const en301549 = scs.map((sc) => `9.${sc}`);
    const dutch = scs.map((sc) => NL[sc]).find(Boolean) || NL_FALLBACK;
    return {
      id: v.id,
      impact: v.impact || 'minor',
      help: v.help,
      description: v.description,
      helpUrl: v.helpUrl,
      wcag: scs,
      en301549,
      dutch,
      nodes: (v.nodes || []).map((n) => ({
        target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target),
        html: n.html,
        summary: n.failureSummary || '',
      })),
    };
  });
}

const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

/** Build summary counts and an indicative score from a results set. */
export function summarize(results) {
  const violations = annotateViolations(results.violations || []);
  violations.sort(
    (a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9)
  );

  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  let affectedElements = 0;
  for (const v of violations) {
    byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
    affectedElements += v.nodes.length;
  }

  const passCount = (results.passes || []).length;
  const failCount = violations.length;
  const total = passCount + failCount;
  // Honest, indicative score: share of automated checks that passed.
  const score = total === 0 ? 100 : Math.round((passCount / total) * 100);

  return {
    score,
    violations,
    byImpact,
    affectedElements,
    passCount,
    incompleteCount: (results.incomplete || []).length,
    url: results.url,
    timestamp: results.timestamp,
  };
}
