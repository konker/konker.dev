export async function root(input: any) {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        input,
      },
      // eslint-disable-next-line fp/no-nil
      null,
      2
    ),
  };
}
