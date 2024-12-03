import * as P from '@konker.dev/effect-ts-prelude';

import * as E from './index';

// Type for possible events
type ExampleType = 'Start' | 'End' | 'Num';

// 1 ... 100
const numbers = [...Array(100).keys()].map((x) => x + 1);

const prog = P.pipe(
  // Create an event dispatcher
  E.createTinyEventDispatcher<ExampleType, number>(),

  // Add a listener for the Start event
  P.Effect.flatMap(E.addListener('Start' as ExampleType, () => P.Console.log('START DETECTED'))),

  // Add a listener for the End event
  P.Effect.flatMap(E.addListener('End' as ExampleType, () => P.Console.log('END DETECTED'))),

  // Add a listener for the Number event, and implement FizzBuzz
  P.Effect.flatMap(
    E.addListener('Num' as ExampleType, (_, n) => {
      if (n === undefined) return P.Effect.fail(new Error('No number given!'));
      if (n % 15 === 0) return P.Console.log('FizzBuzz');
      if (n % 5 === 0) return P.Console.log('Buzz');
      if (n % 3 === 0) return P.Console.log('Fizz');
      return P.Console.log(n);
    })
  ),

  // Notify the Start event
  P.Effect.flatMap(E.notify('Start' as ExampleType)),

  // Notify a Num event for each item in 1 ... 100
  P.Effect.flatMap((dispatcher) =>
    P.pipe(
      numbers,
      P.Effect.reduce(dispatcher, (acc, x) => P.pipe(acc, E.notify('Num' as ExampleType, x)))
    )
  ),

  // Notify the End event
  P.Effect.flatMap(E.notify('End' as ExampleType))
);

// Execute the program
// eslint-disable-next-line fp/no-unused-expression
(async function main() {
  return P.Effect.runPromise(prog);
})().catch(console.error);
