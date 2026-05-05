import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════
//  CHEMISTRY ENGINE
// ═══════════════════════════════════════════════════
const BASE_PKA = 4.83;
const SUBS = {
  none: { label:"H",    sym:"—H",    color:"#64748b", effect:0,     type:"neutral", fullName:"Hydrogen" },
  F:    { label:"F",    sym:"—F",    color:"#a78bfa", effect:-0.90, type:"EWG",     fullName:"Fluorine" },
  Cl:   { label:"Cl",   sym:"—Cl",   color:"#22d3ee", effect:-0.60, type:"EWG",     fullName:"Chlorine" },
  Br:   { label:"Br",   sym:"—Br",   color:"#fb923c", effect:-0.45, type:"EWG",     fullName:"Bromine" },
  NO2:  { label:"NO2",  sym:"—NO₂",  color:"#f87171", effect:-1.10, type:"EWG",     fullName:"Nitro" },
  OH:   { label:"OH",   sym:"—OH",   color:"#34d399", effect:-0.25, type:"EWG",     fullName:"Hydroxyl" },
  OCH3: { label:"OCH3", sym:"—OCH₃", color:"#6ee7b7", effect:-0.18, type:"EWG",     fullName:"Methoxy" },
  NH2:  { label:"NH2",  sym:"—NH₂",  color:"#fbbf24", effect:+0.08, type:"EDG",     fullName:"Amino" },
  CH3:  { label:"CH3",  sym:"—CH₃",  color:"#4ade80", effect:+0.05, type:"EDG",     fullName:"Methyl" },
};
const PF = { 2:1.0, 3:0.45, 4:0.18, 5:0.05 };
const POS_NAME = { 2:"alpha (C2)", 3:"beta (C3)", 4:"gamma (C4)", 5:"delta (C5)" };
const EMPTY_MOL = { 2:"none", 3:"none", 4:"none", 5:"none" };

function calcPKa(mol) {
  let d = 0;
  for (const [p,s] of Object.entries(mol))
    if (s!=="none") d += SUBS[s].effect * PF[parseInt(p)];
  return Math.max(0.5, Math.min(14, BASE_PKA + d));
}
function calcPH(pka) {
  const Ka=Math.pow(10,-pka), C=0.1;
  return Math.max(0,-Math.log10((-Ka+Math.sqrt(Ka*Ka+4*Ka*C))/2));
}
function getEWGPull(mol) {
  let pull=0;
  for (const [p,s] of Object.entries(mol))
    if (s!=="none" && SUBS[s].type==="EWG")
      pull += Math.abs(SUBS[s].effect)*PF[parseInt(p)];
  return Math.min(1,pull/1.3);
}

// ═══════════════════════════════════════════════════
//  EXAM-STYLE REASONING ENGINE
// ═══════════════════════════════════════════════════
function getPositionLabel(pos) { return POS_NAME[pos] || `C${pos}`; }

function buildSingleReasoning(mol) {
  const pka = calcPKa(mol);
  const ph  = calcPH(pka);
  const EWGs = Object.entries(mol).filter(([,s])=>SUBS[s]?.type==="EWG");
  const EDGs = Object.entries(mol).filter(([,s])=>SUBS[s]?.type==="EDG");
  const hasAny = EWGs.length>0 || EDGs.length>0;

  if (!hasAny) return {
    lines:[
      { mark:"Baseline", text:"This is pentanoic acid with no substituents. The conjugate base is the carboxylate ion (RCOO⁻) with pKa = 4.83." },
      { mark:"Note", text:"Add a substituent to observe how the inductive effect alters the stability of the conjugate base and the acidity of the acid." },
    ]
  };

  const lines = [];

  if (EWGs.length===1) {
    const [pos, sub] = EWGs[0];
    const s = SUBS[sub];
    lines.push({ mark:"M1", text:`The presence of ${s.sym} as an electron withdrawing group (EWG) at the ${getPositionLabel(parseInt(pos))} position stabilises the carboxylate ion (RCOO⁻).` });
    lines.push({ mark:"M2", text:`Through the inductive effect, ${s.sym} withdraws electron density through the sigma bonds toward itself, dispersing the negative charge away from the oxygen atom of the carboxylate ion, thus weakening the O—H bond and increasing acidity.` });
    lines.push({ mark:"M3", text:`Since ${s.sym} is at the ${getPositionLabel(parseInt(pos))} position, the inductive effect is ${parseInt(pos)===2?"at its strongest — the alpha carbon is directly adjacent to the carboxyl group":parseInt(pos)===3?"moderately strong — the beta carbon is one bond further from the carboxyl group":"relatively weak — the effect diminishes significantly with increasing distance from the —COOH group"}.` });
    lines.push({ mark:"Result", text:`pKa = ${pka.toFixed(2)} (${pka<BASE_PKA?"lower than baseline 4.83 — more acidic":"higher than baseline 4.83 — less acidic"}). pH of 0.1M solution = ${ph.toFixed(2)}.` });
  } else if (EWGs.length>1) {
    lines.push({ mark:"M1", text:`The presence of multiple electron withdrawing groups (EWGs): ${EWGs.map(([p,s])=>`${SUBS[s].sym} at ${getPositionLabel(parseInt(p))}`).join(", ")} — each stabilises the carboxylate ion (RCOO⁻) through the inductive effect.` });
    lines.push({ mark:"M2", text:`Each EWG withdraws electron density through the sigma bonds, dispersing the negative charge of the carboxylate ion. The cumulative effect of multiple EWGs results in greater stabilisation of the conjugate base compared to a single EWG.` });
    const closest = EWGs.reduce((a,b)=>parseInt(a[0])<parseInt(b[0])?a:b);
    lines.push({ mark:"M3", text:`${SUBS[closest[1]].sym} at the ${getPositionLabel(parseInt(closest[0]))} position contributes the strongest inductive effect as it is closest to the —COOH group. The inductive effect decreases with increasing distance from the carboxyl group.` });
    lines.push({ mark:"Result", text:`pKa = ${pka.toFixed(2)} — significantly lower than baseline 4.83, reflecting strong cumulative EWG stabilisation. pH of 0.1M solution = ${ph.toFixed(2)}.` });
  }

  if (EDGs.length>0) {
    const [pos,sub] = EDGs[0];
    lines.push({ mark:"M1", text:`The presence of ${SUBS[sub].sym} as an electron donating group (EDG) at the ${getPositionLabel(parseInt(pos))} position destabilises the carboxylate ion (RCOO⁻).` });
    lines.push({ mark:"M2", text:`Through the inductive effect, ${SUBS[sub].sym} donates electron density toward the carboxylate ion, concentrating the negative charge on the oxygen atom. This strengthens the O—H bond and decreases acidity.` });
    lines.push({ mark:"Result", text:`pKa = ${pka.toFixed(2)} (higher than baseline 4.83 — less acidic). pH of 0.1M solution = ${ph.toFixed(2)}.` });
  }

  return { lines };
}

function buildCompareReasoning(molA, molB) {
  const pkaA=calcPKa(molA), pkaB=calcPKa(molB);
  const phA=calcPH(pkaA), phB=calcPH(pkaB);
  const diff=Math.abs(pkaA-pkaB);
  const moreAcid = pkaA<pkaB?"A":pkaA>pkaB?"B":"equal";

  if (moreAcid==="equal") return { lines:[
    { mark:"Note", text:"Both acids have identical pKa values — their substituents produce equivalent net inductive effects on the carboxylate ion." }
  ]};

  const winner = moreAcid==="A"?molA:molB;
  const loser  = moreAcid==="A"?molB:molA;
  const winPka = moreAcid==="A"?pkaA:pkaB;
  const losPka = moreAcid==="A"?pkaB:pkaA;
  const winLabel = moreAcid==="A"?"Acid A":"Acid B";
  const losLabel = moreAcid==="A"?"Acid B":"Acid A";

  const winEWGs=Object.entries(winner).filter(([,s])=>SUBS[s]?.type==="EWG");
  const losEWGs=Object.entries(loser).filter(([,s])=>SUBS[s]?.type==="EWG");
  const winEDGs=Object.entries(winner).filter(([,s])=>SUBS[s]?.type==="EDG");

  const lines=[];
  lines.push({ mark:"M1", text:`${winLabel} (pKa = ${winPka.toFixed(2)}) is more acidic than ${losLabel} (pKa = ${losPka.toFixed(2)}), as it has a lower pKa value, indicating a stronger acid with a more stable conjugate base (carboxylate ion, RCOO⁻).` });

  if (winEWGs.length>0 && losEWGs.length>0) {
    const wSub=SUBS[winEWGs[0][1]], lSub=SUBS[losEWGs[0][1]];
    const wPos=parseInt(winEWGs[0][0]), lPos=parseInt(losEWGs[0][0]);
    if (winEWGs[0][1]===losEWGs[0][1] && wPos!==lPos) {
      lines.push({ mark:"M2", text:`Both acids contain the same EWG (${wSub.sym}), however in ${winLabel}, ${wSub.sym} is at the ${getPositionLabel(wPos)} position, whereas in ${losLabel}, it is at the ${getPositionLabel(lPos)} position.` });
      lines.push({ mark:"M3", text:`The ${getPositionLabel(wPos)} position is closer to the —COOH group, resulting in a stronger inductive effect. The inductive effect decreases with increasing distance from the carboxyl group — alpha > beta > gamma > delta.` });
    } else if (winEWGs[0][0]===losEWGs[0][0] && winEWGs[0][1]!==losEWGs[0][1]) {
      lines.push({ mark:"M2", text:`Both EWGs are at the same carbon position, however ${wSub.sym} exerts a stronger electron withdrawing inductive effect than ${lSub.sym}, as ${wSub.fullName} has a higher electronegativity / larger effect constant.` });
      lines.push({ mark:"M3", text:`A stronger EWG disperses the negative charge of the carboxylate ion more effectively, producing greater stabilisation of the conjugate base and a lower pKa.` });
    } else {
      lines.push({ mark:"M2", text:`${winLabel} contains ${wSub.sym} at the ${getPositionLabel(wPos)} position, which exerts a stronger net inductive electron-withdrawing effect on the carboxylate ion compared to ${losLabel} (${lSub.sym} at ${getPositionLabel(lPos)}).` });
      lines.push({ mark:"M3", text:`Greater electron withdrawal disperses the negative charge of RCOO⁻ more effectively, stabilising the conjugate base and weakening the O—H bond — resulting in higher acidity.` });
    }
  } else if (winEWGs.length>losEWGs.length) {
    lines.push({ mark:"M2", text:`${winLabel} contains more electron withdrawing groups (${winEWGs.length}) compared to ${losLabel} (${losEWGs.length}). The cumulative inductive effect of multiple EWGs provides greater stabilisation of the carboxylate ion.` });
    lines.push({ mark:"M3", text:`Each additional EWG disperses the negative charge further, weakening the O—H bond and lowering the pKa. More EWGs = stronger combined inductive effect = more acidic.` });
  } else if (winEDGs.length<Object.entries(loser).filter(([,s])=>SUBS[s]?.type==="EDG").length) {
    lines.push({ mark:"M2", text:`${losLabel} contains more electron donating groups (EDG), which donate electron density toward the carboxylate ion, concentrating negative charge on the oxygen atom and destabilising the conjugate base.` });
    lines.push({ mark:"M3", text:`${winLabel} has fewer EDG groups, resulting in less destabilisation of the conjugate base and therefore higher acidity.` });
  } else {
    lines.push({ mark:"M2", text:`The substituents in ${winLabel} produce a stronger net electron-withdrawing inductive effect, resulting in greater stabilisation of the carboxylate ion (RCOO⁻).` });
    lines.push({ mark:"M3", text:`A more stable conjugate base means a weaker O—H bond, facilitating easier proton (H⁺) release and hence higher acidity.` });
  }

  lines.push({ mark:"Result", text:`ΔpKa = ${diff.toFixed(2)}, representing a ${Math.pow(10,diff).toFixed(1)}× difference in Ka. At 0.1M, the pH difference is ${Math.abs(phA-phB).toFixed(2)} units.` });
  return { lines };
}

const RES_DATA = [
  {
    id:"carboxylic", name:"Carboxylic Acid", formula:"RCOOH", conjBase:"RCOO⁻", conjName:"carboxylate ion",
    pka:4.75, color:"#f87171", acidity:"Strongest", stability:96,
    lines:[
      { mark:"M1", text:"Upon ionisation, carboxylic acid (RCOOH) forms the carboxylate ion (RCOO⁻) as the conjugate base." },
      { mark:"M2", text:"The negative charge/electrons of the carboxylate ion is delocalised between TWO electronegative oxygen atoms through resonance, forming two equivalent resonance structures." },
      { mark:"M3", text:"This delocalisation is highly effective as both oxygen atoms are equally electronegative, making the carboxylate ion the most stable conjugate base. A more stable conjugate base weakens the O—H bond, facilitating easier H⁺ release." },
      { mark:"M4", text:"Additionally, the C=O group exerts an inductive electron-withdrawing effect, further stabilising the carboxylate ion. Therefore, carboxylic acid is the strongest acid among the four compounds." },
    ]
  },
  {
    id:"phenol", name:"Phenol", formula:"C₆H₅OH", conjBase:"C₆H₅O⁻", conjName:"phenoxide ion",
    pka:9.95, color:"#fb923c", acidity:"Moderate", stability:58,
    lines:[
      { mark:"M1", text:"Upon ionisation, phenol (C₆H₅OH) forms the phenoxide ion (C₆H₅O⁻) as the conjugate base." },
      { mark:"M2", text:"The negative charge/electrons of the phenoxide ion is delocalised between the oxygen atom and the carbon atoms of the benzene ring through resonance." },
      { mark:"M3", text:"However, this resonance stabilisation is less effective than in the carboxylate ion because the carbon atoms of the benzene ring are less electronegative than oxygen atoms. The negative charge is partially distributed over less electronegative atoms." },
      { mark:"M4", text:"Therefore, phenol is less acidic than carboxylic acid (pKa ≈ 10 vs ≈ 4.75) but more acidic than water and aliphatic alcohols, as it still benefits from partial resonance stabilisation of its conjugate base." },
    ]
  },
  {
    id:"water", name:"Water", formula:"H₂O", conjBase:"OH⁻", conjName:"hydroxide ion",
    pka:15.74, color:"#38bdf8", acidity:"Very Weak", stability:14,
    lines:[
      { mark:"M1", text:"Upon ionisation, water (H₂O) forms the hydroxide ion (OH⁻) as the conjugate base." },
      { mark:"M2", text:"The hydroxide ion has NO resonance stabilisation — the negative charge is fully localised on the single oxygen atom." },
      { mark:"M3", text:"However, water is slightly more acidic than aliphatic alcohols because it has no alkyl electron-donating group (EDG) attached. There is no group donating electrons toward OH⁻ to further destabilise it." },
      { mark:"M4", text:"The oxygen atom itself is electronegative, providing moderate ability to bear the negative charge. Therefore, water has a pKa of approximately 15.74." },
    ]
  },
  {
    id:"alcohol", name:"Aliphatic Alcohol", formula:"ROH", conjBase:"RO⁻", conjName:"alkoxide ion",
    pka:16.0, color:"#4ade80", acidity:"Weakest", stability:8,
    lines:[
      { mark:"M1", text:"Upon ionisation, aliphatic alcohol (ROH) forms the alkoxide ion (RO⁻) as the conjugate base." },
      { mark:"M2", text:"The alkoxide ion has NO resonance stabilisation. The negative charge is fully localised on the single oxygen atom with no delocalisation whatsoever." },
      { mark:"M3", text:"Furthermore, the alkyl group (R) acts as an electron donating group (EDG), donating electron density toward the oxygen atom through the inductive effect. This increases the electron density on O⁻, concentrating the negative charge and destabilising the alkoxide ion." },
      { mark:"M4", text:"The combination of no resonance stabilisation and active EDG destabilisation makes the alkoxide ion the least stable conjugate base. Therefore, aliphatic alcohol is the least acidic of the four compounds." },
    ]
  },
];

// ═══════════════════════════════════════════════════
//  TWO-TIER WORKSHEET QUESTIONS
// ═══════════════════════════════════════════════════
const WS_QUESTIONS = [
  // ── PART 1: Nature of Substituent (4 questions) ──
  {
    part:1, qNum:1,
    partTitle:"Nature of the Substituent",
    context:"Pentanoic acid (no substituent) has pKa = 4.83. Now place —Cl at C2.",
    simSetup:{ molA:{ 2:"Cl",3:"none",4:"none",5:"none" } },
    tier1:{
      question:"Compared to pentanoic acid, 2-chloropentanoic acid is:",
      options:["More acidic (lower pKa)", "Less acidic (higher pKa)", "Equally acidic", "Cannot be determined"],
      correct:0,
      feedbackCorrect:"Correct. The pKa of 2-chloropentanoic acid (~4.23) is lower than pentanoic acid (4.83), confirming it is more acidic.",
      feedbackWrong:"Incorrect. 2-Chloropentanoic acid has a lower pKa (≈4.23) than pentanoic acid (4.83), meaning it is MORE acidic.",
    },
    tier2:{
      question:"The best explanation for why —Cl at C2 increases acidity is:",
      options:[
        "—Cl donates electrons to the carboxylate ion, strengthening the O—H bond",
        "—Cl as an electron withdrawing group (EWG) stabilises the carboxylate ion (RCOO⁻) by dispersing its negative charge through the inductive effect, weakening the O—H bond",
        "—Cl increases the molecular mass of the acid",
        "—Cl reacts with the carboxyl group directly"
      ],
      correct:1,
      feedbackCorrect:"Excellent. This is the correct PSPM-style reasoning: name the group type (EWG), name the conjugate base (RCOO⁻), state the mechanism (inductive effect disperses negative charge), and state the consequence (O—H bond weakens).",
      feedbackWrong:"Incorrect. The correct reasoning: The presence of —Cl as an electron withdrawing group (EWG) stabilises the carboxylate ion (RCOO⁻) through the inductive effect, as the negative charge is dispersed away from the oxygen atom, weakening the O—H bond and increasing acidity.",
    },
    modelAnswer:"The presence of —Cl as an electron withdrawing group (EWG) at the alpha carbon (C2) stabilises the carboxylate ion (RCOO⁻) through the inductive effect. The negative charge of RCOO⁻ is dispersed away from the oxygen atom, making the conjugate base more stable, weakening the O—H bond, and facilitating H⁺ release. Therefore, 2-chloropentanoic acid is more acidic than pentanoic acid (pKa 4.23 < 4.83).",
  },
  {
    part:1, qNum:2,
    partTitle:"Nature of the Substituent",
    context:"Now place —CH₃ at C2 instead. Compare with pentanoic acid (pKa = 4.83).",
    simSetup:{ molA:{ 2:"CH3",3:"none",4:"none",5:"none" } },
    tier1:{
      question:"2-Methylpentanoic acid compared to pentanoic acid is:",
      options:["More acidic (lower pKa)", "Less acidic (higher pKa)", "Equally acidic", "Much stronger acid"],
      correct:1,
      feedbackCorrect:"Correct. Adding —CH₃ raises the pKa slightly above 4.83 — the acid becomes less acidic, not more.",
      feedbackWrong:"Incorrect. —CH₃ is an electron DONATING group (EDG). It destabilises the carboxylate ion, raising pKa and making the acid LESS acidic.",
    },
    tier2:{
      question:"Why does —CH₃ at C2 decrease acidity?",
      options:[
        "—CH₃ withdraws electrons, destabilising the carboxylate ion",
        "—CH₃ as an electron donating group (EDG) donates electron density toward the carboxylate ion (RCOO⁻), concentrating the negative charge on oxygen and destabilising the conjugate base",
        "—CH₃ increases the size of the molecule",
        "—CH₃ blocks the carboxyl group from ionising"
      ],
      correct:1,
      feedbackCorrect:"Correct. Key PSPM keywords present: EDG, donates electron density, concentrates negative charge, destabilises conjugate base (RCOO⁻).",
      feedbackWrong:"Incorrect. The correct reasoning: The presence of —CH₃ as an electron donating group (EDG) donates electron density toward the carboxylate ion (RCOO⁻) through the inductive effect, concentrating the negative charge on the oxygen atom and destabilising the conjugate base. This strengthens the O—H bond and decreases acidity.",
    },
    modelAnswer:"The presence of —CH₃ as an electron donating group (EDG) at the alpha carbon (C2) destabilises the carboxylate ion (RCOO⁻) through the inductive effect. Electron density is donated toward the oxygen atom, concentrating the negative charge and making the conjugate base less stable. This strengthens the O—H bond, making H⁺ release more difficult. Therefore, 2-methylpentanoic acid is less acidic than pentanoic acid.",
  },
  {
    part:1, qNum:3,
    partTitle:"Nature of the Substituent",
    context:"Compare two acids: —F at C2 vs —Cl at C2 (both at the same position).",
    simSetup:{ molA:{ 2:"F",3:"none",4:"none",5:"none" }, molB:{ 2:"Cl",3:"none",4:"none",5:"none" } },
    tier1:{
      question:"Which acid is more acidic?",
      options:["2-Fluoropentanoic acid (—F at C2)", "2-Chloropentanoic acid (—Cl at C2)", "Both are equally acidic", "2-Chloropentanoic acid, because Cl is larger"],
      correct:0,
      feedbackCorrect:"Correct. —F at C2 gives a lower pKa (~3.93) than —Cl at C2 (~4.23), confirming 2-fluoropentanoic acid is more acidic.",
      feedbackWrong:"Incorrect. Despite Cl being a larger atom, —F produces a greater inductive effect because fluorine has higher electronegativity. 2-Fluoropentanoic acid has a lower pKa (~3.93 vs ~4.23).",
    },
    tier2:{
      question:"Why is —F a stronger EWG than —Cl even though Cl is a larger atom?",
      options:[
        "Because F forms a stronger covalent bond",
        "Because the inductive effect depends on electronegativity, not atomic size — fluorine (χ = 3.98) is more electronegative than chlorine (χ = 3.16), withdrawing electrons more strongly through the sigma bonds",
        "Because F is further from the carboxyl group",
        "Because Cl is an EDG"
      ],
      correct:1,
      feedbackCorrect:"Correct. The inductive effect correlates with electronegativity, not atomic size. F > Cl > Br in EWG strength despite increasing atomic size.",
      feedbackWrong:"Incorrect. The correct reasoning: The strength of the inductive electron-withdrawing effect depends on electronegativity, not atomic size. Fluorine has a higher electronegativity (χ = 3.98) compared to chlorine (χ = 3.16), causing —F to withdraw electron density more strongly through the sigma bonds, stabilising the carboxylate ion more effectively.",
    },
    modelAnswer:"2-Fluoropentanoic acid is more acidic than 2-chloropentanoic acid. Although both —F and —Cl are electron withdrawing groups (EWGs), the strength of the inductive effect depends on electronegativity, not atomic size. Fluorine (χ = 3.98) is more electronegative than chlorine (χ = 3.16), thus —F withdraws electron density more strongly through sigma bonds, stabilising the carboxylate ion (RCOO⁻) more effectively, weakening the O—H bond and resulting in a lower pKa.",
  },
  {
    part:1, qNum:4,
    partTitle:"Nature of the Substituent",
    context:"Compare —NO₂ at C2 vs —F at C2. Both are strong EWGs.",
    simSetup:{ molA:{ 2:"NO2",3:"none",4:"none",5:"none" }, molB:{ 2:"F",3:"none",4:"none",5:"none" } },
    tier1:{
      question:"Which acid has the lower pKa (more acidic)?",
      options:["2-Nitropentanoic acid (—NO₂ at C2)", "2-Fluoropentanoic acid (—F at C2)", "Both the same", "—F is always stronger than any other EWG"],
      correct:0,
      feedbackCorrect:"Correct. —NO₂ has a larger effect constant (−1.10) than —F (−0.90) at the same position. pKa of 2-nitropentanoic acid ≈ 3.73, vs 2-fluoropentanoic acid ≈ 3.93.",
      feedbackWrong:"Incorrect. —NO₂ is a stronger EWG than —F overall. Despite fluorine being more electronegative, the nitro group has a larger cumulative electron-withdrawing effect constant due to its additional resonance withdrawal.",
    },
    tier2:{
      question:"The correct explanation for —NO₂ being a stronger EWG than —F is:",
      options:[
        "NO₂ is larger than F",
        "—NO₂ exerts both inductive electron withdrawal through sigma bonds AND resonance electron withdrawal through its own pi system, giving it a larger cumulative electron-withdrawing effect than —F which acts only through induction",
        "—F donates electrons to the ring",
        "—NO₂ is always stronger because nitrogen is more electronegative than fluorine"
      ],
      correct:1,
      feedbackCorrect:"Excellent. —NO₂ is a powerful EWG because it combines inductive withdrawal (through sigma bonds) AND resonance withdrawal (through its N=O pi system) — a dual mechanism that gives it a larger effect constant than —F.",
      feedbackWrong:"Incorrect. —NO₂ withdraws electrons through TWO mechanisms: (1) inductive effect through sigma bonds, and (2) resonance withdrawal through its own N=O pi system. This dual withdrawal gives —NO₂ a larger cumulative effect constant (−1.10) than —F (−0.90) which acts through induction only.",
    },
    modelAnswer:"2-Nitropentanoic acid is more acidic than 2-fluoropentanoic acid. The —NO₂ group exerts electron withdrawal through both the inductive effect (sigma bonds) and its own resonance system (N=O pi bonds), giving it a larger cumulative electron-withdrawing effect constant (−1.10) compared to —F (−0.90). This greater withdrawal more effectively stabilises the carboxylate ion (RCOO⁻), resulting in a lower pKa (≈3.73 vs ≈3.93).",
  },

  // ── PART 2: Quantity of Substituents (2 questions) ──
  {
    part:2, qNum:1,
    partTitle:"Quantity of Substituents",
    context:"Compare Acid A (one —Cl at C2) vs Acid B (—Cl at C2, C3, and C4).",
    simSetup:{ molA:{ 2:"Cl",3:"none",4:"none",5:"none" }, molB:{ 2:"Cl",3:"Cl",4:"Cl",5:"none" } },
    tier1:{
      question:"Which acid is more acidic?",
      options:["Acid A (1 × —Cl)", "Acid B (3 × —Cl)", "Both equally acidic", "Cannot compare acids with different numbers of substituents"],
      correct:1,
      feedbackCorrect:"Correct. More EWG groups = stronger cumulative inductive effect = more stable RCOO⁻ = lower pKa.",
      feedbackWrong:"Incorrect. Acid B has three —Cl groups, each withdrawing electron density through the inductive effect. Their cumulative effect stabilises the carboxylate ion far more than a single —Cl in Acid A.",
    },
    tier2:{
      question:"The best explanation for why Acid B has a lower pKa is:",
      options:[
        "Acid B has more atoms, making it heavier",
        "The three —Cl groups in Acid B each act as electron withdrawing groups (EWGs), and their cumulative inductive effect disperses the negative charge of the carboxylate ion (RCOO⁻) more effectively than a single —Cl, producing greater stabilisation of the conjugate base",
        "—Cl at C3 and C4 are electron donating groups",
        "More substituents make the acid harder to dissolve"
      ],
      correct:1,
      feedbackCorrect:"Correct. Key points: each —Cl is an EWG, cumulative effect, greater dispersal of negative charge of RCOO⁻, greater stabilisation of conjugate base.",
      feedbackWrong:"Incorrect. The correct reasoning: Each of the three —Cl groups acts as an electron withdrawing group (EWG) through the inductive effect. Their cumulative withdrawal disperses the negative charge of the carboxylate ion (RCOO⁻) more extensively, producing greater stabilisation of the conjugate base than a single —Cl group. This results in a lower pKa and higher acidity.",
    },
    modelAnswer:"Acid B (three —Cl groups) is more acidic than Acid A (one —Cl group). Each —Cl group acts as an electron withdrawing group (EWG) through the inductive effect, dispersing the negative charge of the carboxylate ion (RCOO⁻). The cumulative electron-withdrawing effect of three —Cl groups provides greater stabilisation of the conjugate base than a single —Cl, weakening the O—H bond more extensively and resulting in a significantly lower pKa.",
  },
  {
    part:2, qNum:2,
    partTitle:"Quantity of Substituents",
    context:"Now compare Acid A (—Cl at C2 only) vs Acid B (—Cl at C2 AND —CH₃ at C3).",
    simSetup:{ molA:{ 2:"Cl",3:"none",4:"none",5:"none" }, molB:{ 2:"Cl",3:"CH3",4:"none",5:"none" } },
    tier1:{
      question:"Which acid has the lower pKa?",
      options:["Acid A (—Cl at C2 only)", "Acid B (—Cl at C2, —CH₃ at C3)", "Both equal", "Acid B is always more acidic when it has more substituents"],
      correct:0,
      feedbackCorrect:"Correct. In Acid B, the —CH₃ at C3 partially offsets the —Cl effect by donating electrons (EDG), raising the pKa slightly compared to Acid A.",
      feedbackWrong:"Incorrect. In Acid B, —CH₃ at C3 is an EDG that donates electron density toward the carboxylate ion, partially counteracting the withdrawal by —Cl. This reduces the net stabilisation compared to Acid A (—Cl alone).",
    },
    tier2:{
      question:"Why does adding —CH₃ at C3 to an acid that already has —Cl at C2 reduce its acidity?",
      options:[
        "—CH₃ blocks the —Cl from working",
        "—CH₃ as an electron donating group (EDG) donates electron density toward the carboxylate ion (RCOO⁻), partially counteracting the electron withdrawal of —Cl, concentrating more negative charge on the oxygen atom and destabilising the conjugate base relative to Acid A",
        "—CH₃ reacts with —Cl",
        "—CH₃ at C3 has no effect because it is too far"
      ],
      correct:1,
      feedbackCorrect:"Correct. Two opposing groups: —Cl (EWG, stabilises RCOO⁻) vs —CH₃ (EDG, destabilises RCOO⁻). The net effect is less acidic than —Cl alone.",
      feedbackWrong:"Incorrect. —CH₃ is an electron donating group (EDG). In Acid B, —CH₃ at C3 donates electrons toward the carboxylate ion through the inductive effect, concentrating negative charge on the oxygen atom and partially destabilising RCOO⁻. This counteracts the stabilising effect of —Cl, resulting in a higher pKa compared to Acid A.",
    },
    modelAnswer:"Acid A (—Cl at C2 only) is more acidic. In Acid B, —CH₃ at C3 acts as an electron donating group (EDG), donating electron density toward the carboxylate ion (RCOO⁻) through the inductive effect. This partially counteracts the electron withdrawal of —Cl, concentrating more negative charge on the oxygen atom and destabilising the conjugate base relative to Acid A. The opposing effects result in Acid B having a higher pKa than Acid A.",
  },

  // ── PART 3: Position / Distance Effect (2 questions) ──
  {
    part:3, qNum:1,
    partTitle:"Position / Distance Effect",
    context:"Place —NO₂ at C2, then at C4. Observe the pKa change.",
    simSetup:{ molA:{ 2:"NO2",3:"none",4:"none",5:"none" }, molB:{ 2:"none",3:"none",4:"NO2",5:"none" } },
    tier1:{
      question:"Comparing —NO₂ at C2 vs —NO₂ at C4, which compound is more acidic?",
      options:["—NO₂ at C2 (alpha position)", "—NO₂ at C4 (gamma position)", "Both equally acidic — position does not matter", "—NO₂ at C4 because it is further away"],
      correct:0,
      feedbackCorrect:"Correct. —NO₂ at C2 (alpha, position factor 1.0) has a far stronger effect than —NO₂ at C4 (gamma, position factor 0.18).",
      feedbackWrong:"Incorrect. The inductive effect diminishes with increasing distance from the —COOH group. —NO₂ at C2 (alpha carbon) exerts the strongest inductive effect, giving the lowest pKa.",
    },
    tier2:{
      question:"The correct explanation for the position effect is:",
      options:[
        "The inductive effect acts through space and is unaffected by the number of bonds",
        "The inductive effect is transmitted through sigma bonds and decreases with increasing distance from the carboxyl group — alpha carbon (C2) > beta (C3) > gamma (C4) > delta (C5)",
        "EWGs at C4 are stronger because they have more space to act",
        "Position only matters for EDG, not EWG"
      ],
      correct:1,
      feedbackCorrect:"Correct. The inductive effect operates through sigma bonds and is attenuated at each bond — this is why alpha > beta > gamma > delta in terms of effect strength.",
      feedbackWrong:"Incorrect. The inductive effect is transmitted through sigma bonds (C—C bonds), and its strength decreases at each successive bond. Therefore, an EWG at the alpha carbon (C2, directly adjacent to —COOH) exerts the strongest effect, with diminishing strength at beta (C3), gamma (C4), and delta (C5) positions.",
    },
    modelAnswer:"The acid with —NO₂ at C2 (alpha position) is more acidic. The inductive effect is transmitted through sigma bonds and its strength decreases with increasing distance from the carboxyl group. —NO₂ at the alpha carbon (C2) is directly adjacent to —COOH, exerting maximum electron withdrawal and greatest stabilisation of the carboxylate ion (RCOO⁻). At the gamma position (C4), the effect is significantly attenuated across multiple bonds, resulting in a higher pKa.",
  },
  {
    part:3, qNum:2,
    partTitle:"Position / Distance Effect",
    context:"A student says: 'It does not matter where on the chain the EWG is placed — it will always have the same effect.' Evaluate this claim using the simulator.",
    simSetup:{ molA:{ 2:"Cl",3:"none",4:"none",5:"none" }, molB:{ 2:"none",3:"none",4:"none",5:"Cl" } },
    tier1:{
      question:"Is the student's claim correct?",
      options:["Yes — EWG strength is fixed regardless of position", "No — the inductive effect decreases with distance, so position significantly affects acidity", "Partially correct — position only matters beyond C3", "Correct, but only for halogen substituents"],
      correct:1,
      feedbackCorrect:"Correct. Position profoundly affects the magnitude of the inductive effect. —Cl at C2 vs C5 produces dramatically different pKa values.",
      feedbackWrong:"Incorrect. The student's claim is wrong. The inductive effect diminishes significantly with each successive C—C bond. —Cl at C2 (position factor 1.0) has an approximately 20× stronger effect than —Cl at C5 (position factor 0.05).",
    },
    tier2:{
      question:"The student's claim is incorrect because:",
      options:[
        "EWGs lose their electronegativity when placed further from —COOH",
        "The inductive effect operates through sigma bonds and is attenuated at each C—C bond — the further the EWG from the carboxyl group, the weaker its effect on the carboxylate ion (RCOO⁻) and the smaller the reduction in pKa",
        "EWGs become EDGs beyond C3",
        "The chain length determines acidity, not the substituent"
      ],
      correct:1,
      feedbackCorrect:"Correct. The key principle: inductive effect through sigma bonds, attenuated at each bond, position factor decreases alpha > beta > gamma > delta.",
      feedbackWrong:"Incorrect. The inductive effect is transmitted through sigma bonds and is weakened at each C—C bond in the chain. The further the EWG from the carboxyl group, the less effectively it can withdraw electron density from the carboxylate ion (RCOO⁻), resulting in a smaller reduction in pKa. Therefore, position of the EWG significantly determines the magnitude of its effect on acidity.",
    },
    modelAnswer:"The student's claim is incorrect. The inductive effect operates through sigma bonds and its strength is attenuated at each successive C—C bond. An EWG such as —Cl at the alpha carbon (C2) exerts maximum electron withdrawal on the carboxylate ion (RCOO⁻), producing the greatest stabilisation and lowest pKa. As —Cl is moved to beta (C3), gamma (C4), and delta (C5) positions, the inductive effect weakens progressively, resulting in higher pKa values at each step. Therefore, position of the EWG is critical in determining the magnitude of its effect on acidity.",
  },

  // ── PART 4: Resonance Comparison (2 questions) ──
  {
    part:4, qNum:1,
    partTitle:"Resonance Comparison",
    context:"Consider four compounds: carboxylic acid (RCOOH), phenol (C₆H₅OH), water (H₂O), and aliphatic alcohol (ROH).",
    simSetup:null,
    tier1:{
      question:"Arrange in correct order of INCREASING acidity (least acidic → most acidic):",
      options:[
        "Carboxylic acid < Phenol < Water < Aliphatic alcohol",
        "Aliphatic alcohol < Water < Phenol < Carboxylic acid",
        "Water < Aliphatic alcohol < Phenol < Carboxylic acid",
        "Phenol < Carboxylic acid < Water < Aliphatic alcohol"
      ],
      correct:1,
      feedbackCorrect:"Correct. Aliphatic alcohol < Water < Phenol < Carboxylic acid. This order reflects increasing stability of the conjugate base: RO⁻ (least stable) → OH⁻ → C₆H₅O⁻ → RCOO⁻ (most stable).",
      feedbackWrong:"Incorrect. The correct order of increasing acidity is: Aliphatic alcohol < Water < Phenol < Carboxylic acid. This is determined by the stability of the conjugate base formed upon ionisation.",
    },
    tier2:{
      question:"Why is carboxylic acid the most acidic of the four?",
      options:[
        "Carboxylic acid has the most hydrogen atoms",
        "Upon ionisation, the negative charge/electrons of the carboxylate ion (RCOO⁻) is delocalised between TWO electronegative oxygen atoms through resonance, making it the most stable conjugate base",
        "Carboxylic acid has a double bond which makes it more reactive",
        "The COOH group repels electrons, pushing H⁺ away"
      ],
      correct:1,
      feedbackCorrect:"Excellent. This is the exact PSPM keyword formulation: 'negative charge delocalised between TWO electronegative oxygen atoms of the carboxylate ion' — this is the key phrase examiners award marks for.",
      feedbackWrong:"Incorrect. Upon ionisation, carboxylic acid forms the carboxylate ion (RCOO⁻). The negative charge/electrons is delocalised between TWO electronegative oxygen atoms through resonance. This highly effective delocalisation makes RCOO⁻ the most stable conjugate base, weakening the O—H bond maximally and making carboxylic acid the strongest acid.",
    },
    modelAnswer:"The correct order of increasing acidity is: Aliphatic alcohol < Water < Phenol < Carboxylic acid.\n\nCarboxylic acid is the most acidic because upon ionisation, the negative charge/electrons of the carboxylate ion (RCOO⁻) is delocalised between TWO electronegative oxygen atoms through resonance. This is highly effective stabilisation, as both oxygen atoms are equally electronegative.\n\nPhenol is more acidic than water because the phenoxide ion (C₆H₅O⁻) undergoes resonance — the negative charge is delocalised between the oxygen atom and the carbon atoms of the benzene ring. However, this is less effective than in RCOO⁻ as carbon atoms are less electronegative than oxygen.\n\nAliphatic alcohol is the least acidic because the alkoxide ion (RO⁻) has no resonance stabilisation, and the alkyl group (EDG) donates electrons toward O⁻, further destabilising the conjugate base.",
  },
  {
    part:4, qNum:2,
    partTitle:"Resonance Comparison",
    context:"Focus specifically on phenol vs carboxylic acid — both have resonance stabilisation of their conjugate bases, yet their pKa values differ greatly (~10 vs ~4.75).",
    simSetup:null,
    tier1:{
      question:"Why is phenol (pKa ≈ 10) significantly less acidic than carboxylic acid (pKa ≈ 4.75) despite both having resonance?",
      options:[
        "Phenol has more resonance structures, making it more stable",
        "The resonance stabilisation in carboxylic acid is more effective because the negative charge is delocalised over two electronegative oxygen atoms, whereas in phenol it extends over less electronegative carbon atoms of the benzene ring",
        "Phenol does not actually have resonance stabilisation",
        "Carboxylic acid has a longer carbon chain"
      ],
      correct:1,
      feedbackCorrect:"Correct. The quality of resonance delocalisation matters more than the number of resonance structures. Two equivalent O atoms > O + C atoms in terms of stabilisation effectiveness.",
      feedbackWrong:"Incorrect. Both phenol and carboxylic acid have resonance, but the quality differs. In RCOO⁻, charge is shared between two electronegative O atoms (very effective). In C₆H₅O⁻, charge extends to less electronegative C atoms of the benzene ring (less effective). More effective resonance = more stable conjugate base = lower pKa.",
    },
    tier2:{
      question:"The correct comparison of resonance effectiveness is:",
      options:[
        "Phenoxide ion has stronger resonance because it has more resonance structures across the benzene ring",
        "The carboxylate ion (RCOO⁻) has more effective resonance stabilisation than the phenoxide ion (C₆H₅O⁻) because delocalisation in RCOO⁻ occurs between two equally electronegative oxygen atoms, whereas in C₆H₅O⁻ delocalisation extends over less electronegative carbon atoms",
        "Both have equally effective resonance",
        "Resonance in phenol is stronger because benzene rings are more stable"
      ],
      correct:1,
      feedbackCorrect:"Correct. This is the precise PSPM comparative statement: carboxylate > phenoxide in resonance effectiveness because O atoms > C atoms in electronegativity. This distinction is frequently tested.",
      feedbackWrong:"Incorrect. The correct comparison: The carboxylate ion (RCOO⁻) has MORE effective resonance stabilisation than the phenoxide ion (C₆H₅O⁻). In RCOO⁻, the negative charge is delocalised between two equally electronegative oxygen atoms. In C₆H₅O⁻, the negative charge is delocalised between the oxygen atom and the carbon atoms of the benzene ring, which are LESS electronegative than oxygen. Less electronegative atoms stabilise negative charge less effectively.",
    },
    modelAnswer:"Carboxylic acid is more acidic than phenol despite both having resonance stabilisation of their conjugate bases.\n\nIn the carboxylate ion (RCOO⁻), the negative charge/electrons is delocalised between TWO electronegative oxygen atoms — both atoms are equally electronegative, producing highly effective stabilisation.\n\nIn the phenoxide ion (C₆H₅O⁻), the negative charge is delocalised between the oxygen atom and the carbon atoms of the benzene ring. However, carbon atoms are LESS electronegative than oxygen atoms, making this resonance less effective at stabilising the negative charge.\n\nTherefore, RCOO⁻ is more stable than C₆H₅O⁻, the O—H bond in carboxylic acid is weaker, and carboxylic acid has a significantly lower pKa (~4.75 vs ~10).",
  },
];

// ═══════════════════════════════════════════════════
//  QUIZ DATA (Exit Ticket — unchanged)
// ═══════════════════════════════════════════════════
const QUIZ = [
  { q:"A student adds —NO₂ to C2 and —F to C4. Which contributes MORE to lowering the pKa?", opts:["—F at C4 (F is more electronegative)","—NO₂ at C2 (stronger EWG AND closer to COOH)","Both contribute equally","—F at C4 because halogens are always stronger"], ans:1, exp:"Position matters as much as EWG strength. —NO₂ has effect constant −1.1 AND C2 position factor 1.0 vs 0.18 for C4. Net: −1.10 vs −0.16." },
  { q:"Comparing —Br and —F at C2: Why does —F lower pKa more despite Br being larger?", opts:["Br is an EDG at C2","F has higher electronegativity, exerting stronger inductive withdrawal","Atomic size determines EWG strength","Both lower pKa equally"], ans:1, exp:"Inductive effect strength correlates with electronegativity, not atomic size. F (χ=3.98) > Cl (χ=3.16) > Br (χ=2.96)." },
  { q:"Why is carboxylic acid (pKa ~4.75) far more acidic than phenol (pKa ~9.95)?", opts:["Carboxylic acids are larger molecules","Phenol has more resonance structures so it is more stable","Carboxylate delocalises charge over TWO equivalent oxygens; phenoxide spreads charge to less electronegative ring carbons","The inductive effect in carboxylic acids is weaker"], ans:2, exp:"Quality of resonance matters more than quantity. RCOO⁻: two electronegative O atoms (very effective). C₆H₅O⁻: O + less electronegative C atoms (less effective)." },
  { q:"Aliphatic alcohols (pKa ~16) are LESS acidic than water (pKa ~15.7). Why?", opts:["Water has more hydrogen atoms","Alkyl groups are EDG — they push electrons onto O⁻, destabilising the alkoxide ion","Water has stronger O—H bonds","Alcohol molecules are larger and harder to deprotonate"], ans:1, exp:"Alkyl EDG groups donate electrons to O⁻, increasing electron density and destabilising alkoxide. OH⁻ has no such destabilising group." },
  { q:"To design the most acidic pentanoic acid derivative using only ONE substituent, what is the optimal choice?", opts:["—F at C5","—CH₃ at C2","—NO₂ at C2","—Br at C3"], ans:2, exp:"—NO₂ has the largest effect constant (−1.1) and C2 has position factor 1.0 — maximum possible product. ΔpKa = −1.1." },
  { q:"Why can the resonance (mesomeric) effect of —OCH₃ NOT reach the COOH group in an aliphatic chain?", opts:["The carbon chain is too long","Resonance requires a conjugated pi-system; saturated C—C sigma bonds cannot transmit resonance effects","Oxygen is not electronegative enough for resonance","EDG resonance only works at C5"], ans:1, exp:"Resonance effects need overlapping p-orbitals in a conjugated system. Saturated sp3 C—C sigma bonds cannot transmit resonance — only inductive effects operate in aliphatic chains." },
];

// ═══════════════════════════════════════════════════
//  CARBON NODE COMPONENT
// ═══════════════════════════════════════════════════
function CarbonNode({ pos, sub, dragOver, setDragOver, onDrop, onSet }) {
  const [open, setOpen] = useState(false);
  const info = SUBS[sub];
  const pf = PF[pos];
  const glow = sub!=="none" && info.type==="EWG"
    ? `0 0 ${14*pf}px ${7*pf}px rgba(239,68,68,${0.55*pf})`
    : sub!=="none" && info.type==="EDG"
    ? "0 0 10px 4px rgba(74,222,128,0.35)" : "none";
  const isOver = dragOver===`${pos}`;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
      <div style={{ width:52, height:52, borderRadius:"50%", border:`2px solid ${isOver?"#38bdf8":"#334155"}`, background:isOver?"#1e3a5f":"#1e293b", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", transition:"all 0.2s", boxShadow:glow }}
        onDragOver={e=>{e.preventDefault();setDragOver(`${pos}`);}} onDragLeave={()=>setDragOver(null)}
        onDrop={()=>{onDrop(pos);setOpen(false);}} onClick={()=>setOpen(o=>!o)}>
        <div style={{ fontSize:10, color:"#64748b", fontWeight:700 }}>C{pos}</div>
        <div style={{ fontSize:11, color:info.color, fontWeight:700 }}>{sub==="none"?"H₂":info.sym}</div>
      </div>
      {open && (
        <div style={{ position:"absolute", top:58, zIndex:30, background:"#1e293b", border:"1px solid #334155", borderRadius:8, padding:8, display:"flex", flexDirection:"column", gap:3, minWidth:90 }}>
          {Object.entries(SUBS).map(([k,s])=>(
            <button key={k} style={{ background:"none", border:`1px solid ${s.color}`, borderRadius:5, padding:"3px 6px", cursor:"pointer", fontSize:11, fontFamily:"inherit", color:s.color }}
              onClick={()=>{onSet(pos,k);setOpen(false);}}>{s.sym}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MOL DISPLAY
// ═══════════════════════════════════════════════════
function MolDisplay({ mol, pull, dragging, dragOver, setDragOver, onDrop, onSet }) {
  const gc = `rgba(239,68,68,${0.08+pull*0.55})`;
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center", background:"#020817", borderRadius:10, padding:"14px 6px", border:"1px solid #1e293b", overflowX:"auto", marginBottom:8 }}>
      <div style={{ textAlign:"center", padding:"0 6px", minWidth:44 }}>
        <div style={{ color:"#f97316", fontWeight:800, fontSize:13 }}>COOH</div>
        <div style={{ fontSize:10, color:"#64748b" }}>(C1)</div>
      </div>
      {[2,3,4,5].map((pos,i)=>(
        <div key={pos} style={{ display:"flex", alignItems:"center" }}>
          <div style={{ width:18, height:2, background:"#334155" }}/>
          <CarbonNode pos={pos} sub={mol[pos]} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} onSet={onSet}/>
        </div>
      ))}
      <div style={{ width:18, height:2, background:"#334155" }}/>
      <div style={{ textAlign:"center", padding:"0 6px", minWidth:44 }}>
        <div style={{ color:"#94a3b8", fontWeight:800, fontSize:13 }}>CH₃</div>
        <div style={{ fontSize:10, color:"#64748b" }}>(C5)</div>
      </div>
      {pull>0.08 && <div style={{ position:"absolute", inset:0, pointerEvents:"none", borderRadius:10, background:`radial-gradient(ellipse at 18% 50%, ${gc} 0%, transparent 65%)` }}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  PALETTE
// ═══════════════════════════════════════════════════
function Palette({ dragging, setDragging, compact }) {
  return (
    <div style={{ marginTop:compact?6:12 }}>
      {!compact && <div style={{ fontSize:10, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:"1px" }}>Drag or click a carbon to place</div>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {Object.entries(SUBS).filter(([k])=>k!=="none").map(([k,s])=>(
          <div key={k} draggable onDragStart={()=>setDragging(k)} onDragEnd={()=>setDragging(null)} title={s.fullName}
            style={{ border:`1px solid ${s.color}`, borderRadius:7, padding:"5px 8px", cursor:"grab", userSelect:"none", minWidth:50, textAlign:"center", color:s.color, background:dragging===k?"#1e3a5f":"#0f172a", transform:dragging===k?"scale(1.1)":"scale(1)", transition:"all 0.15s" }}>
            <div style={{ fontWeight:800, fontSize:compact?11:13 }}>{s.sym}</div>
            <div style={{ fontSize:9, opacity:0.8, textTransform:"uppercase" }}>{s.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  METRICS ROW
// ═══════════════════════════════════════════════════
function MetricsRow({ pka, ph, pull, compact }) {
  const ac = pka<3?"#ef4444":pka<4?"#f97316":pka<4.83?"#eab308":pka<5.5?"#22d3ee":"#94a3b8";
  const al = pka<3?"Very Strong":pka<4?"Strong":pka<4.83?"Moderately Strong":pka<5.5?"Weak":"Very Weak";
  return (
    <div style={{ display:"grid", gridTemplateColumns:compact?"1fr 1fr":"1fr 1fr 1fr", gap:8, margin:"10px 0" }}>
      <Metric label="pKa" value={pka.toFixed(2)} color={ac} sub={al}/>
      <Metric label="pH (0.1M)" value={ph.toFixed(2)} color="#a78bfa" sub="Solution"/>
      {!compact && <Metric label="EWG Pull" value={`${(pull*100).toFixed(0)}%`} color="#f87171" sub="Relative"/>}
    </div>
  );
}
function Metric({ label, value, color, sub }) {
  return (
    <div style={{ background:"#020817", borderRadius:10, padding:"12px 8px", textAlign:"center", border:"1px solid #1e293b" }}>
      <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px" }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color, margin:"2px 0" }}>{value}</div>
      <div style={{ fontSize:10, color:"#64748b" }}>{sub}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  EXAM REASONING BOX
// ═══════════════════════════════════════════════════
function ExamReasoningBox({ lines, title }) {
  return (
    <div style={{ background:"#020817", border:"1px solid #1e3a5f", borderRadius:10, padding:14, marginTop:10 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#38bdf8", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:10 }}>
        {title || "Exam-Style Reasoning"}
      </div>
      {lines.map((l,i)=>(
        <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
          <div style={{ minWidth:52, background:"#0c2a40", border:"1px solid #1d4ed8", borderRadius:5, padding:"2px 6px", fontSize:10, fontWeight:800, color:"#38bdf8", textAlign:"center", flexShrink:0 }}>{l.mark}</div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.8 }}>{l.text}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  GLOW BARS
// ═══════════════════════════════════════════════════
function GlowBars({ pull }) {
  return (
    <div style={{ background:"#020817", borderRadius:10, padding:12, border:"1px solid #1e293b", marginBottom:8 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Electron Density Map</div>
      {[
        { label:"Electron density at C=O bond", val:1-pull, color:"#4ade80" },
        { label:"EWG inductive pull strength",  val:pull,   color:"#ef4444" },
        { label:"Carboxylate anion stability",  val:pull*0.9, color:"#38bdf8" },
      ].map(b=>(
        <div key={b.label} style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, color:"#94a3b8", marginBottom:2 }}>{b.label}</div>
          <div style={{ height:7, background:"#1e293b", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${b.val*100}%`, background:b.color, boxShadow:`0 0 6px ${b.color}`, transition:"width 0.5s" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  BUILDER TAB
// ═══════════════════════════════════════════════════
function BuilderTab({ molA, setMolA, dragging, setDragging, dragOver, setDragOver }) {
  const pka=calcPKa(molA), ph=calcPH(pka), pull=getEWGPull(molA);
  const reasoning=buildSingleReasoning(molA);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={S.panel}>
        <h2 style={S.panelH}>Molecule Builder</h2>
        <p style={S.hint}>Click a carbon node to choose a substituent, or drag from the palette.</p>
        <MolDisplay mol={molA} pull={pull} dragging={dragging} dragOver={dragOver} setDragOver={setDragOver}
          onDrop={pos=>{if(dragging)setMolA(m=>({...m,[pos]:dragging}));setDragOver(null);}}
          onSet={(pos,sub)=>setMolA(m=>({...m,[pos]:sub}))}/>
        <Palette dragging={dragging} setDragging={setDragging}/>
        <button style={S.resetBtn} onClick={()=>setMolA({...EMPTY_MOL})}>Reset</button>
      </div>
      <div style={S.panel}>
        <h2 style={S.panelH}>Acidity Metrics</h2>
        <MetricsRow pka={pka} ph={ph} pull={pull}/>
        <GlowBars pull={pull}/>
        <ExamReasoningBox lines={reasoning.lines} title="Exam-Style Reasoning (PSPM Format)"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  COMPARE TAB
// ═══════════════════════════════════════════════════
function CompareTab({ molA, setMolA, molB, setMolB, dragging, setDragging, dragOver, setDragOver }) {
  const pkaA=calcPKa(molA),phA=calcPH(pkaA),pullA=getEWGPull(molA);
  const pkaB=calcPKa(molB),phB=calcPH(pkaB),pullB=getEWGPull(molB);
  const reasoning=buildCompareReasoning(molA,molB);
  return (
    <div>
      <h2 style={S.panelH}>Side-by-Side Comparison</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {[{id:"A",mol:molA,setMol:setMolA,pka:pkaA,ph:phA,pull:pullA},{id:"B",mol:molB,setMol:setMolB,pka:pkaB,ph:phB,pull:pullB}].map(({id,mol,setMol,pka,ph,pull})=>(
          <div key={id} style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:14 }}>
            <div style={{ fontSize:20, fontWeight:900, color:"#38bdf8", marginBottom:10 }}>Acid {id}</div>
            <MolDisplay mol={mol} pull={pull} dragging={dragging} dragOver={dragOver} setDragOver={setDragOver}
              onDrop={pos=>{if(dragging)setMol(m=>({...m,[pos]:dragging}));setDragOver(null);}}
              onSet={(pos,sub)=>setMol(m=>({...m,[pos]:sub}))}/>
            <Palette dragging={dragging} setDragging={setDragging} compact/>
            <button style={S.resetBtn} onClick={()=>setMol({...EMPTY_MOL})}>Reset</button>
            <MetricsRow pka={pka} ph={ph} pull={pull} compact/>
          </div>
        ))}
      </div>
      <ExamReasoningBox lines={reasoning.lines} title="Comparative Exam-Style Reasoning (PSPM Format)"/>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  TWO-TIER MCQ COMPONENT
// ═══════════════════════════════════════════════════
function TwoTierQuestion({ qData, onComplete }) {
  const [tier1Sel, setTier1Sel]   = useState(null);
  const [tier1Done, setTier1Done] = useState(false);
  const [tier2Sel, setTier2Sel]   = useState(null);
  const [tier2Done, setTier2Done] = useState(false);
  const [showModel, setShowModel] = useState(false);

  function submitTier1() {
    if (tier1Sel===null) return;
    setTier1Done(true);
  }
  function submitTier2() {
    if (tier2Sel===null) return;
    setTier2Done(true);
    const t1ok = tier1Sel===qData.tier1.correct;
    const t2ok = tier2Sel===qData.tier2.correct;
    onComplete(t1ok, t2ok);
  }

  const t1ok = tier1Sel===qData.tier1.correct;
  const t2ok = tier2Sel===qData.tier2.correct;

  return (
    <div style={{ background:"#0a1628", borderRadius:10, padding:16, marginBottom:12, border:"1px solid #1e3a5f" }}>
      {/* Context */}
      {qData.context && (
        <div style={{ background:"#0c2a40", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#93c5fd", borderLeft:"3px solid #3b82f6" }}>
          {qData.context}
        </div>
      )}

      {/* TIER 1 */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ background:"#1d4ed8", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:12, letterSpacing:"1px" }}>TIER 1</div>
          <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:700, lineHeight:1.6 }}>{qData.tier1.question}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {qData.tier1.options.map((opt,i)=>{
            let bg="#1e293b", bc="#334155", col="#e2e8f0";
            if (tier1Done) {
              if (i===qData.tier1.correct) { bg="#064e3b"; bc="#4ade80"; col="#4ade80"; }
              else if (i===tier1Sel) { bg="#450a0a"; bc="#ef4444"; col="#ef4444"; }
            } else if (tier1Sel===i) { bg="#1e3a5f"; bc="#38bdf8"; col="#e2e8f0"; }
            return (
              <button key={i} disabled={tier1Done}
                style={{ background:bg, border:`1px solid ${bc}`, borderRadius:8, padding:"8px 12px", cursor:tier1Done?"default":"pointer", textAlign:"left", fontSize:12, fontFamily:"inherit", color:col, transition:"all 0.15s" }}
                onClick={()=>!tier1Done&&setTier1Sel(i)}>
                <span style={{ fontWeight:800, marginRight:8 }}>{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {!tier1Done && (
          <button style={{ ...S.primBtn, marginTop:8, fontSize:12, padding:"7px 18px", opacity:tier1Sel===null?0.4:1 }} disabled={tier1Sel===null} onClick={submitTier1}>Submit Answer</button>
        )}
        {tier1Done && (
          <div style={{ marginTop:8, background:t1ok?"#064e3b":"#450a0a", borderRadius:8, padding:"10px 12px", fontSize:12, color:t1ok?"#4ade80":"#f87171", border:`1px solid ${t1ok?"#4ade80":"#ef4444"}` }}>
            <b>{t1ok?"Correct":"Incorrect"}</b> — {t1ok?qData.tier1.feedbackCorrect:qData.tier1.feedbackWrong}
          </div>
        )}
      </div>

      {/* TIER 2 — only shows after tier 1 submitted */}
      {tier1Done && (
        <div style={{ borderTop:"1px solid #1e293b", paddingTop:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ background:"#7c3aed", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:12, letterSpacing:"1px" }}>TIER 2</div>
            <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:700, lineHeight:1.6 }}>{qData.tier2.question}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {qData.tier2.options.map((opt,i)=>{
              let bg="#1e293b", bc="#334155", col="#e2e8f0";
              if (tier2Done) {
                if (i===qData.tier2.correct) { bg="#064e3b"; bc="#4ade80"; col="#4ade80"; }
                else if (i===tier2Sel) { bg="#450a0a"; bc="#ef4444"; col="#ef4444"; }
              } else if (tier2Sel===i) { bg="#1e3a5f"; bc="#38bdf8"; col="#e2e8f0"; }
              return (
                <button key={i} disabled={tier2Done}
                  style={{ background:bg, border:`1px solid ${bc}`, borderRadius:8, padding:"8px 12px", cursor:tier2Done?"default":"pointer", textAlign:"left", fontSize:12, fontFamily:"inherit", color:col, transition:"all 0.15s" }}
                  onClick={()=>!tier2Done&&setTier2Sel(i)}>
                  <span style={{ fontWeight:800, marginRight:8 }}>{String.fromCharCode(65+i)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {!tier2Done && (
            <button style={{ ...S.primBtn, background:"#7c3aed", marginTop:8, fontSize:12, padding:"7px 18px", opacity:tier2Sel===null?0.4:1 }} disabled={tier2Sel===null} onClick={submitTier2}>Submit Reasoning</button>
          )}
          {tier2Done && (
            <>
              <div style={{ marginTop:8, background:t2ok?"#064e3b":"#450a0a", borderRadius:8, padding:"10px 12px", fontSize:12, color:t2ok?"#4ade80":"#f87171", border:`1px solid ${t2ok?"#4ade80":"#ef4444"}` }}>
                <b>{t2ok?"Correct":"Incorrect"}</b> — {t2ok?qData.tier2.feedbackCorrect:qData.tier2.feedbackWrong}
              </div>
              <button style={{ background:"none", border:"1px solid #334155", borderRadius:6, color:"#64748b", padding:"5px 12px", cursor:"pointer", fontSize:11, fontFamily:"inherit", marginTop:8 }}
                onClick={()=>setShowModel(v=>!v)}>
                {showModel?"Hide":"Show"} Model Answer (Marking Scheme)
              </button>
              {showModel && (
                <div style={{ marginTop:8, background:"#020817", border:"1px solid #1e3a5f", borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#38bdf8", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Model Answer — PSPM Format</div>
                  <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.9, whiteSpace:"pre-line" }}>{qData.modelAnswer}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  WORKSHEET TAB
// ═══════════════════════════════════════════════════
function WorksheetTab({ molA, setMolA, molB, setMolB, dragging, setDragging, dragOver, setDragOver }) {
  const PARTS = [1,2,3,4];
  const PART_LABELS = { 1:"Nature of Substituent", 2:"Quantity of Substituents", 3:"Position / Distance", 4:"Resonance Comparison" };
  const [activePart, setActivePart] = useState(1);
  const [scores, setScores]         = useState({});

  const partQs = WS_QUESTIONS.filter(q=>q.part===activePart);
  const activeQ = WS_QUESTIONS.find(q=>q.part===activePart && q.simSetup);

  // Load sim setup for active part
  useEffect(()=>{
    if (activeQ?.simSetup) {
      if (activeQ.simSetup.molA) setMolA({...EMPTY_MOL,...activeQ.simSetup.molA});
      if (activeQ.simSetup.molB) setMolB({...EMPTY_MOL,...activeQ.simSetup.molB});
    }
  },[activePart]);

  function handleComplete(part, qNum, t1ok, t2ok) {
    setScores(s=>({...s,[`${part}-${qNum}`]:{t1:t1ok,t2:t2ok}}));
  }

  const pkaA=calcPKa(molA), phA=calcPH(pkaA), pullA=getEWGPull(molA);
  const pkaB=calcPKa(molB), phB=calcPH(pkaB), pullB=getEWGPull(molB);
  const showCompare = activePart===1&&WS_QUESTIONS.filter(q=>q.part===1).some(q=>q.simSetup?.molB);

  // Total score
  const total = Object.values(scores).reduce((a,v)=>a+(v.t1?1:0)+(v.t2?1:0),0);
  const maxTotal = WS_QUESTIONS.length*2;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, alignItems:"start" }}>
      {/* LEFT */}
      <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
        <div style={{ background:"#0c2a40", padding:"14px 18px", borderBottom:"1px solid #1e3a5f" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:"#38bdf8" }}>Guided Inquiry Worksheet</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Two-Tier MCQ — Inductive & Resonance Effects</div>
            </div>
            <div style={{ background:"#020817", borderRadius:8, padding:"6px 14px", textAlign:"center", border:"1px solid #1e293b" }}>
              <div style={{ fontSize:10, color:"#64748b" }}>Score</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#38bdf8" }}>{total}/{maxTotal}</div>
            </div>
          </div>
        </div>

        {/* Part tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #1e293b", overflowX:"auto" }}>
          {PARTS.map(p=>(
            <button key={p} style={{ flex:1, background:activePart===p?"#0c1a2e":"none", border:"none", color:activePart===p?"#38bdf8":"#64748b", padding:"10px 8px", cursor:"pointer", fontSize:11, fontFamily:"inherit", borderBottom:activePart===p?"2px solid #38bdf8":"2px solid transparent", whiteSpace:"nowrap" }}
              onClick={()=>setActivePart(p)}>
              Part {p}
            </button>
          ))}
        </div>

        <div style={{ padding:18 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#e2e8f0", marginBottom:4 }}>Part {activePart}: {PART_LABELS[activePart]}</div>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:16 }}>
            {activePart===4 ? "No simulator needed for this part — use the Resonance & Acidity tab for reference." : "The simulator on the right is pre-loaded for each question. You may explore freely."}
          </div>

          {partQs.map((qData,i)=>(
            <div key={`${qData.part}-${qData.qNum}`}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>
                Question {i+1} of {partQs.length}
                {scores[`${qData.part}-${qData.qNum}`] && (
                  <span style={{ marginLeft:10, color:"#38bdf8" }}>
                    {(scores[`${qData.part}-${qData.qNum}`].t1?1:0)+(scores[`${qData.part}-${qData.qNum}`].t2?1:0)}/2 pts
                  </span>
                )}
              </div>
              <TwoTierQuestion qData={qData} onComplete={(t1,t2)=>handleComplete(qData.part,qData.qNum,t1,t2)}/>
            </div>
          ))}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <button style={S.secBtn} disabled={activePart===1} onClick={()=>setActivePart(p=>p-1)} style={{ ...S.secBtn, opacity:activePart===1?0.3:1 }}>Previous</button>
            {activePart<4
              ? <button style={S.primBtn} onClick={()=>setActivePart(p=>p+1)}>Next Part</button>
              : <button style={{ ...S.primBtn, background:"#059669" }}>Complete — Go to Exit Ticket</button>
            }
          </div>
        </div>
      </div>

      {/* RIGHT: simulator */}
      <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:14, position:"sticky", top:20 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>Live Simulator</div>
        {activePart===4 ? (
          <div style={{ fontSize:12, color:"#64748b", padding:"20px 0", textAlign:"center" }}>
            Refer to the<br/><b style={{ color:"#38bdf8" }}>Resonance & Acidity</b><br/>tab for this part.
          </div>
        ) : (
          <>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:4 }}>Molecule A</div>
            <MolDisplay mol={molA} pull={pullA} dragging={dragging} dragOver={dragOver} setDragOver={setDragOver}
              onDrop={pos=>{if(dragging)setMolA(m=>({...m,[pos]:dragging}));setDragOver(null);}}
              onSet={(pos,sub)=>setMolA(m=>({...m,[pos]:sub}))}/>
            {(activePart===1&&WS_QUESTIONS.find(q=>q.part===1&&q.qNum===3)) || activePart===2 ? (
              <>
                <div style={{ fontSize:10, color:"#64748b", marginTop:8, marginBottom:4 }}>Molecule B</div>
                <MolDisplay mol={molB} pull={pullB} dragging={dragging} dragOver={dragOver} setDragOver={setDragOver}
                  onDrop={pos=>{if(dragging)setMolB(m=>({...m,[pos]:dragging}));setDragOver(null);}}
                  onSet={(pos,sub)=>setMolB(m=>({...m,[pos]:sub}))}/>
              </>
            ):null}
            <Palette dragging={dragging} setDragging={setDragging} compact/>
            <div style={{ display:"flex", gap:6, marginTop:6 }}>
              <button style={S.resetBtn} onClick={()=>setMolA({...EMPTY_MOL})}>Reset A</button>
              <button style={S.resetBtn} onClick={()=>setMolB({...EMPTY_MOL})}>Reset B</button>
            </div>
            <MetricsRow pka={pkaA} ph={phA} pull={pullA} compact/>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  RESONANCE TAB
// ═══════════════════════════════════════════════════
function ResonanceTab() {
  const [sel, setSel] = useState("carboxylic");
  const c = RES_DATA.find(x=>x.id===sel);
  const maxPka=17;
  return (
    <div>
      <h2 style={S.panelH}>Resonance Effect & Comparative Acidity</h2>
      <p style={{ ...S.hint, marginBottom:16 }}>At EC025/SK026 level, acidity is determined by both the <b style={{ color:"#f87171" }}>inductive effect</b> (sigma bonds) and the <b style={{ color:"#38bdf8" }}>resonance (mesomeric) effect</b> (pi conjugation). Select a compound below.</p>

      {/* pKa scale */}
      <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:"16px 24px", marginBottom:16 }}>
        <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", marginBottom:36 }}>Acidity Scale — lower pKa = more acidic</div>
        <div style={{ position:"relative", height:56, marginBottom:12 }}>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"#1e293b" }}/>
          {RES_DATA.map(x=>{
            const pct=(x.pka/maxPka)*100;
            return (
              <div key={x.id} style={{ position:"absolute", left:`${pct}%`, transform:"translateX(-50%)", cursor:"pointer", bottom:0 }} onClick={()=>setSel(x.id)}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:sel===x.id?x.color:"transparent", border:`2px solid ${x.color}`, margin:"0 auto 4px" }}/>
                <div style={{ position:"absolute", bottom:20, fontSize:10, color:x.color, textAlign:"center", transform:"translateX(-50%)", whiteSpace:"nowrap", lineHeight:1.4 }}>
                  {x.name}<br/><b>pKa {x.pka}</b>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#475569" }}>
          <span>More Acidic</span><span>Less Acidic</span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {RES_DATA.map(x=>(
          <div key={x.id} style={{ background:"#0f172a", border:`2px solid ${sel===x.id?x.color:"#1e293b"}`, borderRadius:10, padding:14, cursor:"pointer", textAlign:"center", transition:"all 0.2s" }} onClick={()=>setSel(x.id)}>
            <div style={{ fontWeight:800, color:x.color, fontSize:13 }}>{x.name}</div>
            <div style={{ fontSize:11, color:"#64748b" }}>{x.formula}</div>
            <div style={{ fontSize:22, fontWeight:900, color:x.color, margin:"6px 0" }}>{x.pka}</div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>{x.acidity}</div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={S.panel}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <div style={{ width:12, height:12, borderRadius:"50%", background:c.color }}/>
          <div style={{ fontSize:18, fontWeight:900, color:c.color }}>{c.name} — pKa {c.pka}</div>
          <div style={{ background:c.color+"22", border:`1px solid ${c.color}44`, color:c.color, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>{c.acidity}</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <ExamReasoningBox lines={c.lines} title="Exam-Style Explanation (PSPM Keywords)"/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Conjugate Base Stability</div>
            <div style={{ background:"#020817", borderRadius:8, padding:12, border:"1px solid #1e293b" }}>
              {RES_DATA.map(x=>(
                <div key={x.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:110, fontSize:11, color:x.color, flexShrink:0 }}>{x.name}</div>
                  <div style={{ flex:1, height:10, background:"#1e293b", borderRadius:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${x.stability}%`, background:x.color, boxShadow:`0 0 6px ${x.color}`, transition:"width 0.5s" }}/>
                  </div>
                  <div style={{ width:36, fontSize:11, color:x.color, textAlign:"right" }}>{x.stability}%</div>
                </div>
              ))}
            </div>

            {/* Summary table */}
            <div style={{ marginTop:12, fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Summary Table</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead><tr>{["Compound","pKa","Resonance","Inductive","Acidity"].map(h=><th key={h} style={{ padding:"6px 8px", textAlign:"left", color:"#64748b", fontSize:9, textTransform:"uppercase", borderBottom:"1px solid #1e293b" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    ["Carboxylic Acid","~4.75","2 equiv. O atoms (very effective)","Strong C=O withdrawal","Strongest"],
                    ["Phenol","~9.95","O + C atoms of benzene (less effective)","Weak","Moderate"],
                    ["Water","~15.74","None","None","Very Weak"],
                    ["Aliphatic Alcohol","~16.0","None","EDG (alkyl) destabilises","Weakest"],
                  ].map(([name,pka,res,ind,overall],i)=>(
                    <tr key={i} style={{ background:i%2===0?"#0f172a":"#1e293b" }}>
                      <td style={{ padding:"6px 8px", color:RES_DATA[i].color, fontWeight:700 }}>{name}</td>
                      <td style={{ padding:"6px 8px", color:"#f87171" }}>{pka}</td>
                      <td style={{ padding:"6px 8px", color:"#38bdf8" }}>{res}</td>
                      <td style={{ padding:"6px 8px", color:"#94a3b8" }}>{ind}</td>
                      <td style={{ padding:"6px 8px", color:RES_DATA[i].color }}>{overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  QUIZ TAB (Exit Ticket — unchanged format)
// ═══════════════════════════════════════════════════
function QuizTab({ qStep,setQStep,qIdx,setQIdx,qSel,setQSel,qAnswers,setQAnswers,submitted,setSubmitted,sName,setSName,sClass,setSClass,scores,setScores }) {
  async function answerQ(i) { if(qSel!==null)return; setQSel(i); setQAnswers(a=>[...a,{q:qIdx,chosen:i,correct:i===QUIZ[qIdx].ans}]); }
  function nextQ() { if(qIdx<QUIZ.length-1){setQIdx(q=>q+1);setQSel(null);}else setQStep("done"); }
  async function submitScore() {
    const sc=qAnswers.filter(a=>a.correct).length;
    const entry={name:sName,class:sClass,score:sc,total:QUIZ.length,time:new Date().toLocaleString()};
    const updated=[...scores,entry]; setScores(updated);
    try{await window.storage?.set("inducted_scores",JSON.stringify(updated),true);}catch{}
    setSubmitted(true);
  }
  if (qStep==="intro") return (
    <div style={{ display:"flex", justifyContent:"center", paddingTop:12 }}>
      <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:16, padding:28, maxWidth:580, width:"100%" }}>
        <div style={{ fontSize:22, fontWeight:900, color:"#e2e8f0", marginBottom:8 }}>Exit Ticket</div>
        <p style={{ ...S.hint, marginBottom:16 }}>6 questions on inductive effect, substituent effects, and resonance-based acidity.</p>
        <input style={S.input} placeholder="Full name" value={sName} onChange={e=>setSName(e.target.value)}/>
        <input style={S.input} placeholder="Class (e.g. SM1A)" value={sClass} onChange={e=>setSClass(e.target.value)}/>
        <button style={{ ...S.primBtn, opacity:(!sName||!sClass)?0.4:1 }} disabled={!sName||!sClass} onClick={()=>setQStep("question")}>Start Quiz</button>
      </div>
    </div>
  );
  if (qStep==="done") {
    const sc=qAnswers.filter(a=>a.correct).length;
    return (
      <div style={{ display:"flex", justifyContent:"center", paddingTop:12 }}>
        <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:16, padding:28, maxWidth:580, width:"100%" }}>
          <div style={{ fontSize:22, fontWeight:900, color:"#e2e8f0", marginBottom:8 }}>Quiz Complete!</div>
          <div style={{ fontSize:52, fontWeight:900, color:"#38bdf8", margin:"12px 0" }}>{sc}/{QUIZ.length}</div>
          <p style={S.hint}>{sc===6?"Perfect score! Outstanding mastery.":sc>=4?"Good work! Review any incorrect answers.":"Keep revising — focus on resonance effects and position dependency."}</p>
          <div style={{ margin:"12px 0" }}>{qAnswers.map((a,i)=><div key={i} style={{ display:"flex", gap:8, marginBottom:4, fontSize:12, color:"#94a3b8" }}><span style={{ color:a.correct?"#4ade80":"#ef4444" }}>{a.correct?"Correct":"Wrong"}</span><span>Q{i+1}: {QUIZ[i].q.slice(0,60)}...</span></div>)}</div>
          {!submitted?<button style={S.primBtn} onClick={submitScore}>Submit Score to Teacher</button>:<div style={{ color:"#4ade80", fontWeight:700 }}>Score submitted!</div>}
        </div>
      </div>
    );
  }
  const q=QUIZ[qIdx];
  return (
    <div style={{ display:"flex", justifyContent:"center", paddingTop:12 }}>
      <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:16, padding:28, maxWidth:620, width:"100%" }}>
        <div style={{ fontSize:12, color:"#64748b", letterSpacing:"1px", marginBottom:6 }}>QUESTION {qIdx+1} OF {QUIZ.length}</div>
        <div style={{ height:3, background:"#1e293b", borderRadius:2, marginBottom:16 }}><div style={{ height:"100%", width:`${(qIdx/QUIZ.length)*100}%`, background:"#38bdf8", borderRadius:2 }}/></div>
        <div style={{ fontSize:15, color:"#e2e8f0", fontWeight:700, lineHeight:1.7, marginBottom:20 }}>{q.q}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {q.opts.map((opt,i)=>{
            let bg="#1e293b",bc="#334155",col="#e2e8f0";
            if(qSel!==null){if(i===q.ans){bg="#064e3b";bc="#4ade80";col="#4ade80";}else if(i===qSel){bg="#450a0a";bc="#ef4444";col="#ef4444";}}
            return <button key={i} style={{ background:bg, border:`1px solid ${bc}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", textAlign:"left", fontSize:13, fontFamily:"inherit", color:col, transition:"all 0.15s", lineHeight:1.5 }} onClick={()=>answerQ(i)}><span style={{ fontWeight:800, marginRight:10 }}>{String.fromCharCode(65+i)}.</span>{opt}</button>;
          })}
        </div>
        {qSel!==null && <div style={{ marginTop:14, background:"#0c1a30", borderRadius:8, padding:14, fontSize:12, color:"#94a3b8", lineHeight:1.8, border:"1px solid #1d4ed8" }}><b style={{ color:"#38bdf8" }}>Explanation: </b>{q.exp}<div style={{ marginTop:12 }}><button style={S.primBtn} onClick={nextQ}>{qIdx<QUIZ.length-1?"Next Question":"See Results"}</button></div></div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  DASHBOARD TAB
// ═══════════════════════════════════════════════════
function DashboardTab({ scores }) {
  const avg=scores.length?(scores.reduce((a,s)=>a+s.score,0)/scores.length).toFixed(1):"--";
  const perfect=scores.filter(s=>s.score===QUIZ.length).length;
  const pass=scores.filter(s=>s.score>=4).length;
  return (
    <div>
      <h2 style={S.panelH}>Teacher Dashboard</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <Metric label="Submissions" value={scores.length} color="#38bdf8" sub="Students"/>
        <Metric label="Avg Score" value={avg} color="#a78bfa" sub={`out of ${QUIZ.length}`}/>
        <Metric label="Perfect" value={perfect} color="#4ade80" sub="6/6"/>
        <Metric label="Pass Rate" value={scores.length?`${Math.round(pass/scores.length*100)}%`:"--"} color="#fb923c" sub="4 or above"/>
      </div>
      {!scores.length
        ?<div style={{ textAlign:"center", color:"#64748b", padding:40, fontSize:13 }}>No submissions yet.</div>
        :<div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Name","Class","Score","Result","Time"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", color:"#64748b", fontSize:10, textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #1e293b" }}>{h}</th>)}</tr></thead>
            <tbody>{scores.map((s,i)=><tr key={i} style={{ background:i%2===0?"#0f172a":"#1e293b" }}><td style={{ padding:"10px 12px", color:"#e2e8f0" }}>{s.name}</td><td style={{ padding:"10px 12px", color:"#e2e8f0" }}>{s.class}</td><td style={{ padding:"10px 12px", fontWeight:800, fontSize:16, color:s.score===QUIZ.length?"#4ade80":s.score>=4?"#eab308":"#ef4444" }}>{s.score}/{s.total}</td><td style={{ padding:"10px 12px", color:"#94a3b8" }}>{s.score===QUIZ.length?"Excellent":s.score>=4?"Good":s.score>=2?"Fair":"Needs Review"}</td><td style={{ padding:"10px 12px", fontSize:11, color:"#64748b" }}>{s.time}</td></tr>)}</tbody>
          </table>
        </div>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [tab,setTab]             = useState("builder");
  const [molA,setMolA]           = useState({...EMPTY_MOL});
  const [molB,setMolB]           = useState({...EMPTY_MOL});
  const [dragging,setDragging]   = useState(null);
  const [dragOver,setDragOver]   = useState(null);
  const [qStep,setQStep]         = useState("intro");
  const [qIdx,setQIdx]           = useState(0);
  const [qSel,setQSel]           = useState(null);
  const [qAnswers,setQAnswers]   = useState([]);
  const [sName,setSName]         = useState("");
  const [sClass,setSClass]       = useState("");
  const [submitted,setSubmitted] = useState(false);
  const [scores,setScores]       = useState([]);

  useEffect(()=>{
    (async()=>{ try{ const r=await window.storage?.get("inducted_scores",true); if(r?.value)setScores(JSON.parse(r.value)); }catch{} })();
  },[]);

  const TABS=[
    {id:"builder",   icon:"⚗️",  label:"Molecule Builder"},
    {id:"compare",   icon:"⚖️",  label:"Compare"},
    {id:"worksheet", icon:"📋",  label:"Guided Inquiry"},
    {id:"resonance", icon:"🔄",  label:"Resonance & Acidity"},
    {id:"quiz",      icon:"📝",  label:"Exit Ticket"},
    {id:"dashboard", icon:"📊",  label:"Dashboard"},
  ];

  return (
    <div style={{ fontFamily:"'DM Mono','Courier New',monospace", background:"#020817", minHeight:"100vh", color:"#e2e8f0" }}>
      <header style={{ background:"#0a1628", borderBottom:"1px solid #1e293b" }}>
        <div style={{ padding:"14px 24px 4px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <span style={{ fontSize:26, fontWeight:900, color:"#38bdf8", letterSpacing:"-1px" }}>InductEd</span>
            <span style={{ fontSize:12, fontWeight:800, color:"#0ea5e9", background:"#0c2a40", padding:"2px 8px", borderRadius:20, marginLeft:8 }}>v3</span>
            <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>Inductive & Resonance Effect Simulator · EC025 / SK026 · KMKK</div>
          </div>
        </div>
        <nav style={{ display:"flex", gap:2, padding:"0 24px", flexWrap:"wrap" }}>
          {TABS.map(t=>(
            <button key={t.id} style={{ background:tab===t.id?"#0c1a2e":"none", border:"none", color:tab===t.id?"#38bdf8":"#64748b", padding:"8px 14px", cursor:"pointer", fontSize:12, borderBottom:tab===t.id?"2px solid #38bdf8":"2px solid transparent", fontFamily:"inherit" }}
              onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>
          ))}
        </nav>
      </header>
      <main style={{ padding:"20px 24px", maxWidth:1200, margin:"0 auto" }}>
        {tab==="builder"   && <BuilderTab molA={molA} setMolA={setMolA} dragging={dragging} setDragging={setDragging} dragOver={dragOver} setDragOver={setDragOver}/>}
        {tab==="compare"   && <CompareTab molA={molA} setMolA={setMolA} molB={molB} setMolB={setMolB} dragging={dragging} setDragging={setDragging} dragOver={dragOver} setDragOver={setDragOver}/>}
        {tab==="worksheet" && <WorksheetTab molA={molA} setMolA={setMolA} molB={molB} setMolB={setMolB} dragging={dragging} setDragging={setDragging} dragOver={dragOver} setDragOver={setDragOver}/>}
        {tab==="resonance" && <ResonanceTab/>}
        {tab==="quiz"      && <QuizTab qStep={qStep} setQStep={setQStep} qIdx={qIdx} setQIdx={setQIdx} qSel={qSel} setQSel={setQSel} qAnswers={qAnswers} setQAnswers={setQAnswers} submitted={submitted} setSubmitted={setSubmitted} sName={sName} setSName={setSName} sClass={sClass} setSClass={setSClass} scores={scores} setScores={setScores}/>}
        {tab==="dashboard" && <DashboardTab scores={scores}/>}
      </main>
    </div>
  );
}

const S = {
  panel:   { background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:18 },
  panelH:  { fontSize:15, fontWeight:800, color:"#e2e8f0", marginBottom:10 },
  hint:    { fontSize:12, color:"#64748b", lineHeight:1.7, margin:0 },
  resetBtn:{ background:"none", border:"1px solid #334155", borderRadius:6, color:"#64748b", padding:"5px 12px", cursor:"pointer", fontSize:11, fontFamily:"inherit", marginTop:6 },
  primBtn: { background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, padding:"10px 22px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  secBtn:  { background:"none", border:"1px solid #334155", color:"#94a3b8", borderRadius:8, padding:"10px 22px", fontSize:13, cursor:"pointer", fontFamily:"inherit" },
  input:   { width:"100%", background:"#020817", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#e2e8f0", fontSize:13, marginBottom:10, fontFamily:"inherit", boxSizing:"border-box" },
};
