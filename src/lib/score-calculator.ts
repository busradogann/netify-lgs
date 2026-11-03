export interface LGSInput {
  turkce: number;
  matematik: number;
  fen: number;
  inkilap: number;
  din: number;
  yabanciDil: number;
}

export const LGS_LIMITS = {
  turkce: 20,
  matematik: 20,
  fen: 20,
  inkilap: 10,
  din: 10,
  yabanciDil: 10,
} as const;

export const LGS_WEIGHTS = {
  turkce: 4,
  matematik: 4,
  fen: 4,
  inkilap: 2,
  din: 2,
  yabanciDil: 2,
} as const;

export function calculateTotalNet(input: LGSInput): number {
  return (
    input.turkce +
    input.matematik +
    input.fen +
    input.inkilap +
    input.din +
    input.yabanciDil
  );
}

export function calculateWeightedScore(input: LGSInput): number {
  const weighted =
    input.turkce * LGS_WEIGHTS.turkce +
    input.matematik * LGS_WEIGHTS.matematik +
    input.fen * LGS_WEIGHTS.fen +
    input.inkilap * LGS_WEIGHTS.inkilap +
    input.din * LGS_WEIGHTS.din +
    input.yabanciDil * LGS_WEIGHTS.yabanciDil;

  const maxWeighted =
    LGS_LIMITS.turkce * LGS_WEIGHTS.turkce +
    LGS_LIMITS.matematik * LGS_WEIGHTS.matematik +
    LGS_LIMITS.fen * LGS_WEIGHTS.fen +
    LGS_LIMITS.inkilap * LGS_WEIGHTS.inkilap +
    LGS_LIMITS.din * LGS_WEIGHTS.din +
    LGS_LIMITS.yabanciDil * LGS_WEIGHTS.yabanciDil;

  return (weighted / maxWeighted) * 500;
}

export function getSubjectLabel(key: keyof LGSInput): string {
  const labels: Record<keyof LGSInput, string> = {
    turkce: "Türkçe",
    matematik: "Matematik",
    fen: "Fen Bilimleri",
    inkilap: "İnkılap Tarihi",
    din: "Din Kültürü",
    yabanciDil: "Yabancı Dil",
  };
  return labels[key];
}
