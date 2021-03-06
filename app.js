"use strict";
// autobind decorator
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function autobind(_, _2, descriptor) {
    const originalMethod = descriptor.value;
    const adjDesctiptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDesctiptor;
}
function formValidation(validatableInput) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null &&
        typeof validatableInput.value === 'string') {
        isValid =
            isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null &&
        typeof validatableInput.value === 'string') {
        isValid =
            isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    return isValid;
}
// Todo Type
var TodoStatus;
(function (TodoStatus) {
    TodoStatus[TodoStatus["Active"] = 0] = "Active";
    TodoStatus[TodoStatus["Finished"] = 1] = "Finished";
})(TodoStatus || (TodoStatus = {}));
class Todo {
    constructor(id, title, date, status) {
        this.id = id;
        this.title = title;
        this.date = date;
        this.status = status;
    }
}
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
// Todo State Management
class TodoState extends State {
    constructor() {
        super();
        this.todos = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new TodoState();
        return this.instance;
    }
    addTodo(title, dateTime) {
        const newTodo = new Todo(Math.random().toString(), title, dateTime, TodoStatus.Active);
        this.todos.push(newTodo);
        this.updateListeners();
        localStorage.setItem('todo', JSON.stringify(this.todos));
    }
    getTodo() {
        if ("todo" in localStorage) {
            const getData = JSON.parse(localStorage.getItem('todo'));
            for (let i = 0; i < getData.length; i++) {
                let newTodo = new Todo(getData[i].id, getData[i].title, getData[i].date, getData[i].status);
                this.todos.push(newTodo);
                this.updateListeners();
            }
        }
    }
    getAllTodo() {
        return this.todos;
    }
    moveTodo(todoId, newStatus) {
        const todo = this.todos.find(tod => tod.id === todoId);
        if (todo) {
            todo.status = newStatus;
            localStorage.setItem('todo', JSON.stringify(this.todos));
            this.updateListeners();
        }
    }
    deleteTodo(todoId) {
        const todo = this.todos.find(tod => tod.id === todoId);
        for (let i = 0; i < this.todos.length; i++) {
            if (this.todos[i].id === (todo === null || todo === void 0 ? void 0 : todo.id)) {
                this.todos.splice(i, 1);
                localStorage.setItem('todo', JSON.stringify(this.todos));
                this.updateListeners();
            }
        }
    }
    editTodo(todoId, title, dateTime) {
        const todo = this.todos.find(tod => tod.id === todoId);
        for (let i = 0; i < this.todos.length; i++) {
            if (this.todos[i].id === (todo === null || todo === void 0 ? void 0 : todo.id)) {
                this.todos[i].title = title;
                this.todos[i].date = dateTime;
                localStorage.setItem('todo', JSON.stringify(this.todos));
                this.updateListeners();
            }
        }
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.todos.slice());
        }
    }
}
const todoState = TodoState.getInstance();
// Component Base Class
class Component {
    constructor(templateId, hostElementId, insertAtStart, newElementId) {
        this.tempalteElement = document.getElementById(templateId);
        this.hostElement = document.getElementById(hostElementId);
        const importedNode = document.importNode(this.tempalteElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.render(insertAtStart);
    }
    render(insertAtBeginning) {
        this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
    }
}
// TodoItem Class
class TodoItem extends Component {
    constructor(hostId, todo) {
        super('single-todo', hostId, true, todo.id);
        this.todo = todo;
        this.configure();
        this.renderContent();
        this.descriptionInputElement = this.element.querySelector("#edit-description");
    }
    setCompleteHandler() {
        const todoId = this.element.id;
        const todos = todoState.getAllTodo();
        const todo = todos.find(tod => tod.id === todoId);
        if (todo) {
            if (todo.status == 0) {
                todoState.moveTodo(todoId, TodoStatus.Finished);
            }
            else {
                todoState.moveTodo(todoId, TodoStatus.Active);
            }
        }
    }
    deleteTodoHandler() {
        const todoId = this.element.id;
        swal({
            title: 'Alert!',
            text: "Do you want to Delete this Todo?",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Cancel it!'
        }).then(function () {
            todoState.deleteTodo(todoId);
        });
    }
    editTodoHandler() {
        const todoId = this.element.id;
        this.element.querySelector("#edit-todo").classList.add('hidden');
        this.element.querySelector("#update-todo").classList.remove('hidden');
        this.element.querySelector("h4").classList.add('hidden');
        this.descriptionInputElement.value = this.element.querySelector("h4").innerHTML;
        this.descriptionInputElement.classList.remove('hidden');
    }
    updateTodoHandler() {
        const todoId = this.element.id;
        const userInput = this.gatherUserInput();
        const dateTime = new Date().toDateString();
        if (Array.isArray(userInput)) {
            const [desc] = userInput;
            todoState.editTodo(todoId, desc, dateTime);
        }
    }
    configure() {
        this.element.querySelector("#update-todo").addEventListener('click', this.updateTodoHandler);
        this.element.querySelector("#edit-todo").addEventListener('click', this.editTodoHandler);
        this.element.querySelector("#delete-todo").addEventListener('click', this.deleteTodoHandler);
        this.element.querySelector('input').addEventListener('change', this.setCompleteHandler);
    }
    renderContent() {
        this.element.querySelector('h4').textContent = this.todo.title;
        this.element.querySelector('small').textContent = this.todo.date;
    }
    gatherUserInput() {
        const enterDescription = this.descriptionInputElement.value;
        const descriptionValidatable = {
            value: enterDescription,
            required: true,
        };
        if (!formValidation(descriptionValidatable)) {
            swal("invalid input", "Please try again", "error");
            return;
        }
        else
            return [enterDescription];
    }
}
__decorate([
    autobind
], TodoItem.prototype, "setCompleteHandler", null);
__decorate([
    autobind
], TodoItem.prototype, "deleteTodoHandler", null);
__decorate([
    autobind
], TodoItem.prototype, "editTodoHandler", null);
__decorate([
    autobind
], TodoItem.prototype, "updateTodoHandler", null);
__decorate([
    autobind
], TodoItem.prototype, "configure", null);
//TodoList class
class TodoList extends Component {
    constructor(type) {
        super('todo-list', 'todo-container', false, `${type}-todos`);
        this.type = type;
        this.assignedTodos = [];
        this.configure();
        this.renderContent();
    }
    configure() {
        todoState.addListener((todos) => {
            const relevantTodos = todos.filter(tod => {
                if (this.type === 'active') {
                    return tod.status === TodoStatus.Active;
                }
                return tod.status === TodoStatus.Finished;
            });
            this.assignedTodos = relevantTodos;
            this.renderTodos();
        });
    }
    ;
    renderContent() {
        const listId = `${this.type}-todo-list`;
        this.element.querySelector('ul').id = listId;
        if (this.type === 'active') {
            this.element.querySelector('label').className = 'text-warning';
            this.element.querySelector('label').innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${this.type} todos`;
        }
        else {
            this.element.querySelector('label').className = 'text-success';
            this.element.querySelector('label').innerHTML = `<i class="fa fa-check"></i> ${this.type} todos`;
        }
    }
    renderTodos() {
        const listEl = document.getElementById(`${this.type}-todo-list`);
        listEl.innerHTML = '';
        for (const todoItem of this.assignedTodos) {
            new TodoItem(this.element.querySelector('ul').id, todoItem);
        }
    }
}
// Todo Class
class TodoInput extends Component {
    constructor(template, elem) {
        super(template, elem, true);
        this.template = template;
        this.elem = elem;
        this.descriptionInputElement = this.element.querySelector("#description");
        this.configure();
    }
    configure() {
        this.element.addEventListener('submit', this.submitHandler);
        window.addEventListener('load', this.documentLoadHandlier);
    }
    renderContent() { }
    gatherUserInput() {
        const enterDescription = this.descriptionInputElement.value;
        const descriptionValidatable = {
            value: enterDescription,
            required: true,
        };
        if (!formValidation(descriptionValidatable)) {
            swal("invalid input", "Please try again", "error");
            return;
        }
        else
            return [enterDescription];
    }
    clearInput() {
        this.descriptionInputElement.value = '';
    }
    submitHandler(event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        const dateTime = new Date().toDateString();
        if (Array.isArray(userInput)) {
            const [desc] = userInput;
            todoState.addTodo(desc, dateTime);
            this.clearInput();
        }
    }
    documentLoadHandlier() {
        todoState.getTodo();
    }
}
__decorate([
    autobind
], TodoInput.prototype, "submitHandler", null);
