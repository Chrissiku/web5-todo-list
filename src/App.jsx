// ./src/App.jsx

import TodoApp from "./TodoApp";
import Web5Provider from "./Web5Provider";

const App = () => {
  return (
    <>
      <Web5Provider>
        <TodoApp />
      </Web5Provider>
    </>
  );
};
export default App;
