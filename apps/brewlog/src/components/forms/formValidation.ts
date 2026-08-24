export const getFirstValidationError = (errors: readonly unknown[]) => {
  const error = errors[0];
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return typeof error.message === "string" ? error.message : null;
  }
  return error ? "入力内容を確認してください。" : null;
};
