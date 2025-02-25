/**
 * A RequestInit instance which also has a `bodyObject` property
 * which can be anything. Some encoding will need to convert it
 * into a string before it can be used by fetch.
 */
export type WithUnknownRequestBody<I extends RequestInit> = I & {
  bodyObject: unknown;
};

/**
 * A Response where the response body has been retrieved and converted into a string
 */
export type WithBodyString<R extends Response> = R & { bodyString: string };

/**
 * A response with a parsed JSON body. Assumes that the string body has been decoded.
 */
export type WithParsedBody<R extends WithBodyString<Response>> = R & {
  parsedBody: unknown;
};
