/// Due to new typescript problems, inspired by https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
/// Turns any error or anything into a string
export function messageFromError(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as any).message === 'string'
  ) {
    return (err as any).message;

  } else if (typeof err === 'string') {
    return err;
  } else {
    return String(err);
  }
}
