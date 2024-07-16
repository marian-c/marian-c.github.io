export type InstructionsInfo = Record<string, { list: string[]; opCodes: Record<string, number> }>;
export type FinalConfig = {
  __isFinal: true;
  // {LDA: {list: ['izx', 'izy'], opCodes: {IZX: 1, IZY: 2}}}
  instructionsInfo: InstructionsInfo;
};

type OptionalProps = never;

export type OptionalConfig = Omit<FinalConfig, OptionalProps | '__isFinal'> &
  Partial<Pick<FinalConfig, OptionalProps>>;

export type Config = OptionalConfig | FinalConfig;

export function makeConfig(initialConfig: Config): FinalConfig {
  if ('__isFinal' in initialConfig) {
    return initialConfig;
  }

  return {
    ...initialConfig,
    instructionsInfo: Object.fromEntries(
      Object.entries(initialConfig.instructionsInfo).map(([ins, modes]) => {
        return [
          ins.toLowerCase(),
          {
            list: modes.list.map((i) => i.toLowerCase()),
            opCodes: Object.fromEntries(
              Object.entries(modes.opCodes).map(([addressingMode, idx]) => {
                return [addressingMode.toLowerCase(), idx];
              }),
            ),
          },
        ];
      }),
    ),
    __isFinal: true,
  };
}
