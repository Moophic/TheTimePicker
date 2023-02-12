import './App.css';
import {useEffect, useState} from "react";
import {createMachine} from "xstate";
import {useMachine} from "@xstate/react";

function transitions(events, config) {
  return events.reduce((p, c) => { p[c] = config; return p }, {});
}

function timeValid(time) {
  return time.length >= 3 && time.length <= 4
      && hoursValid(time.slice(-4, -2)) && minutesValid(time.slice(-2));
}

function hoursValid(hours) {
  return hours.length > 0 && hours.length < 3
      && hours >= 1 && hours <= 12;
}

function minutesValid(minutes) {
  return minutes.length === 2
      && minutes >= 0 && minutes <= 59;
}

let timePickerMachine = createMachine({
  id: "timePicker",
  predictableActionArguments: true,
  context: {
    time: "",
    hours: null,
    minutes: null,
    half: null,
    valid: false
  },
  initial: "time",
  states: {
    time: {
      on: {
        Backspace: { target: "time", cond: "timeNotEmpty", actions: "popTime" },
        ...transitions([0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            { target: "time", cond: "timeKeyValid", actions: "pushTime" }),
        ...transitions(["a", "A", "p", "P"],
            { target: "valid", cond: "timeValid", actions: "setHalf" }),
        ":": { target: "minutes", cond: "timeAsHoursValid", actions: "setHoursFromTime" }
      }
    },
    minutes: {
      on: {
        Backspace: [
          { target: "minutes", cond: "minutesNotEmpty", actions: "popMinutes" },
          { target: "time", cond: "minutesEmpty", actions: "setTimeFromHours" }
        ],
        ...transitions([0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            { target: "minutes", cond: "minutesKeyValid", actions: "pushMinutes" }),
        ...transitions(["a", "A", "p", "P"],
            { target: "valid", cond: "minutesValid", actions: "setHalf" })
      }
    },
    valid: {
      entry: "setValid",
      exit: "clearValid",
      on: {
        Backspace: [
          { target: "time", cond: "timeNotNull", actions: "clearHalf" },
          { target: "minutes", cond: "minutesNotNull", actions: "clearHalf" }
        ]
      }
    }
  }
},
{
  actions: {
    pushTime: (context, event) => context.time += event.type,
    popTime: context => context.time = context.time.slice(0, -1),
    setHoursFromTime: context => { context.hours = context.time; context.minutes = ""; context.time = null },
    setTimeFromHours: context => { context.time = context.hours; context.hours = null; context.minutes = null; },
    pushMinutes: (context, event) => context.minutes += event.type,
    popMinutes: context => context.minutes = context.minutes.slice(0, -1),
    setHalf: (context, event) => context.half = event.type.toLowerCase(),
    clearHalf: context => context.half = null,
    setValid: context => context.valid = true,
    clearValid: context => context.valid = false
  },
  guards: {
    timeNotEmpty: context => context.time.length > 0,
    timeKeyValid: (context, event) => timeValid((context.time + event.type).padEnd(3, "0")),
    timeValid: context => timeValid(context.time),
    timeAsHoursValid: context => hoursValid(context.time),
    minutesNotEmpty: context => context.minutes.length > 0,
    minutesEmpty: context => context.minutes.length === 0,
    minutesKeyValid: (context, event) => minutesValid((context.minutes + event.type).padEnd(2, "0")),
    minutesValid: context => minutesValid(context.minutes),
    timeNotNull: context => context.time !== null,
    minutesNotNull: context => context.minutes !== null
  }
});

function BetterTimePicker() {
  let [displayValue, setDisplayValue] = useState("");

  const [state, send] = useMachine(timePickerMachine);

  useEffect(() => {
    const time = "14:43";
      for (let c of time) {
        send(c);
      }
    }, []);

  useEffect(() => {
    const hours = state.context.time !== null ? state.context.time.slice(-4, -2) : state.context.hours;
    const minutes = state.context.time !== null ? state.context.time.slice(-2) : state.context.minutes;
    const half = state.context.half !== null ? state.context.half === "a" ? " AM" : " PM" : "";
    const displayValue = hours + (hours !== "" ? ":" : "") + minutes + half;

    setDisplayValue(_ => displayValue);
  }, [state.context.time, state.context.hours, state.context.minutes, state.context.half])

  return (
      <>
        <input type={"text"} value={displayValue} onKeyDown={event => send(event.key)} onChange={() => {}} />
        <p>Valid: {state.context.valid ? "True" : "Invalid"}</p>
        <p>{JSON.stringify({ value: state.value, context: state.context })}</p>
      </>
  );
}

function App() {
  return (
    <div className="App">
      <BetterTimePicker />
    </div>
  );
}

export default App;
