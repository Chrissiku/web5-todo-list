import { useCallback, useContext, useEffect, useState } from "react";
import { Web5Context } from "./Web5Provider";

const SCHEMA_URL = "http://127.0.0.1:5173";

const TodoApp = () => {
  const { web5, did } = useContext(Web5Context);
  const [todos, setTodos] = useState([]);
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTodo, setEditedTodo] = useState(null);

  // Fetch todos from Dwn

  const fetchTodos = useCallback(async () => {
    // const resolution = await web5.did.resolve(did);
    // const didDocument = resolution.didDocument;

    // console.log(didDocument)
    try {
      const { records } = await web5.dwn.records.query({
        message: {
          filter: {
            schema: SCHEMA_URL,
          },
          dateSort: "createdAscending",
        },
      });

      // Add an item to DWN
      const dwnData = await Promise.all(
        records.map(async (record) => {
          const data = await record.data.json();
          return { record, data, id: record.id };
        })
      );
      setTodos(dwnData);
    } catch (error) {
      console.log("Error fetching todos:", error);
    }
  }, [web5]);

  useEffect(() => {
    if (web5 && did) {
      fetchTodos().finally(() => setLoading(false));
    }
  }, [web5, did, fetchTodos]);

  const addItem = async () => {
    const todoData = {
      completed: false,
      description: newTodoDescription,
    };
    setNewTodoDescription("");

    const optimisticTodo = { data: todoData, id: Date.now() }; // Optimistic update
    setTodos((prevTodos) => [...prevTodos, optimisticTodo]);

    try {
      const { record } = await web5.dwn.records.create({
        data: todoData,
        message: {
          schema: SCHEMA_URL,
          dataFormat: "application/json",
        },
      });

      const data = await record.data.json();
      const todo = { record, data, id: record.id };

      setTodos((prevTodos) =>
        prevTodos.map((prevTodo) =>
          prevTodo.id === optimisticTodo.id ? todo : prevTodo
        )
      );
    } catch (error) {
      console.log("Error Creating Item : ", error);
    }
  };

  const deleteItem = async (todoItem) => {
    try {
      // Delete the record from dwn
      await web5.dwn.records.delete({
        message: {
          recordId: todoItem.id,
        },
      });
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== todoItem.id)
      );
    } catch (error) {
      console.log("Error Deleting item : ", error);
      // Revert to the previous state in case of an error
      // setTodos((prevTodos) => [...prevTodos, todoItem]);
    }
  };

  const toggleTodoComplete = async (todoItem) => {
    const updatedTodoData = {
      ...todoItem.data,
      completed: !todoItem.data.completed,
    };

    try {
      // Update rendering
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoItem.id ? { ...todo, data: updatedTodoData } : todo
        )
      );
      // Read the record
      const { record } = await web5.dwn.records.read({
        message: {
          filter: {
            recordId: todoItem.id,
          },
        },
      });

      // Update the record
      await record.update({ data: updatedTodoData });
    } catch (error) {
      console.log("Error Completing Todo: ", error);
    }
  };

  const updateItem = async (todoItem, updatedDescription) => {
    const updatedTodoData = {
      ...todoItem.data,
      description: updatedDescription,
    };
    setNewTodoDescription("");

    try {
      // Update Rendering
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoItem.id ? { ...todo, data: updatedTodoData } : todo
        )
      );

      //Read  the record
      const { record } = await web5.dwn.records.read({
        message: {
          filter: {
            recordId: todoItem.id,
          },
        },
      });

      //Update the dwn
      await record.update({ data: updatedTodoData });

      // Reset editing state
      setIsEditing(false);
      setEditedTodo(null);
    } catch (error) {
      console.log("Error Updating Item : ", error);
    }
  };

  const cancelUpdate = () => {
    setIsEditing(false);
    setNewTodoDescription("");
  };

  return (
    <div>
      {loading ? (
        <h1>Loading ... </h1>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isEditing && editedTodo) {
                updateItem(editedTodo, newTodoDescription);
              } else {
                addItem();
              }
            }}
            className="flex space-x-4"
          >
            <div>
              <label htmlFor="add-todo" className="sr-only">
                {isEditing ? "Update todo" : "Add a todo"}
              </label>
              <textarea
                rows="1"
                name="add-todo"
                id="add-todo"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (isEditing && editedTodo) {
                      updateItem(editedTodo, newTodoDescription);
                    } else {
                      addItem();
                    }
                  }
                }}
                placeholder={isEditing ? "Update todo" : "Add a Todo"}
              />
            </div>
            <button type="submit">{isEditing ? "Save" : "Add"}</button>
            {isEditing && (
              <button type="button" onClick={cancelUpdate}>
                Cancel
              </button>
            )}
          </form>
          <div>
            <h1>Todo List</h1>
            <div>{!did ? "Connecting to web5 . . ." : "Web5 Connected"}</div>
            <button type="button" onClick={() => setIsEditing(false)}>
              Add new
            </button>

            <h2>Todos</h2>
            <ol>
              {todos.map((todo) => (
                <li key={todo.id}>
                  <div onClick={() => toggleTodoComplete(todo)}>
                    {todo.data.completed ? <span>✅</span> : <span>☑️</span>}
                  </div>
                  <span>{todo.data.description}</span>{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setNewTodoDescription(todo.data.description);
                      setIsEditing(true);
                      setEditedTodo(todo);
                    }}
                  >
                    {" "}
                    Update{" "}
                  </button>
                  <button type="button" onClick={() => deleteItem(todo)}>
                    Delete
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default TodoApp;
