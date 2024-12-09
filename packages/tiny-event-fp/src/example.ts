import { Console, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import * as E from './index';

// Type for possible events
type ExampleType = 'Start' | 'End' | 'Num';

// 1 ... 100
const numbers = [...Array(100).keys()].map((x) => x + 1);

const prog = pipe(
  // Create an event dispatcher
  E.createTinyEventDispatcher<ExampleType, number>(),

  // Add a listener for the Start event
  Effect.flatMap(E.addListener('Start' as ExampleType, () => Console.log('START DETECTED'))),

  // Add a listener for the End event
  Effect.flatMap(E.addListener('End' as ExampleType, () => Console.log('END DETECTED'))),

  // Add a listener for the Number event, and implement FizzBuzz
  Effect.flatMap(
    E.addListener('Num' as ExampleType, (_, n) => {
      if (n === undefined) return Effect.fail(new Error('No number given!'));
      if (n % 15 === 0) return Console.log('FizzBuzz');
      if (n % 5 === 0) return Console.log('Buzz');
      if (n % 3 === 0) return Console.log('Fizz');
      return Console.log(n);
    })
  ),

  // Notify the Start event
  Effect.flatMap(E.notify('Start' as ExampleType)),

  // Notify a Num event for each item in 1 ... 100
  Effect.flatMap((dispatcher) =>
    pipe(
      numbers,
      Effect.reduce(dispatcher, (acc, x) => pipe(acc, E.notify('Num' as ExampleType, x)))
    )
  ),

  // Notify the End event
  Effect.flatMap(E.notify('End' as ExampleType))
);

// Execute the program
// eslint-disable-next-line fp/no-unused-expression
(async function main() {
  return Effect.runPromise(prog);
})().catch(console.error);
