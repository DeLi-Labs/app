export type DdVerdict = "Strong" | "Medium" | "Weak";

const DD_VERDICTS: readonly DdVerdict[] = ["Strong", "Medium", "Weak"];

const pickRandomVerdict = (): DdVerdict => DD_VERDICTS[Math.floor(Math.random() * DD_VERDICTS.length)];

export const generatePatentStrength = (): DdVerdict => pickRandomVerdict();

export const generateDefendantRecoverability = (): DdVerdict => pickRandomVerdict();
