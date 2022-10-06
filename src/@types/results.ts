export type Result<E, V> = {success: false; error: E} | {success: true; value: V};

export type BalanceCheckResult = Result<Error, number>;
