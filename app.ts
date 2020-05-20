// autobind decorator

function autobind(
    _: any,
    _2: string,
    descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDesctiptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjDesctiptor;
}

// Validation
interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
}

function formValidation(validatableInput: Validatable) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (
        validatableInput.minLength != null &&
        typeof validatableInput.value === 'string'
    ) {
        isValid =
            isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (
        validatableInput.maxLength != null &&
        typeof validatableInput.value === 'string'
    ) {
        isValid =
            isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    return isValid;
}


// Move Active to Finished Interface

interface SourseTodo {
    setCompleteHandler(event: MouseEvent): any;
}

interface TargetTodo {
    setActiveHandler(event: MouseEvent): any;
}



// Todo Type
enum TodoStatus { Active, Finished }

class Todo {

    constructor(
        public id: string,
        public title: string,
        public date: string,
        public status: TodoStatus) {

    }
}

type Listner<T> = (items: T[]) => void;

class State<T> {

    protected listeners: Listner<T>[] = [];

    addListener(listenerFn: Listner<T>) {
        this.listeners.push(listenerFn);
    }

}
// Todo State Management
class TodoState extends State<Todo> {

    private todos: Todo[] = [];
    private static instance: TodoState;

    private constructor() {
        super()
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new TodoState()
        return this.instance;
    }

    addTodo(title: string, dateTime: string) {
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
    moveTodo(todoId: string, newStatus: TodoStatus) {
        const todo = this.todos.find(tod => tod.id === todoId);
        if (todo) {
            todo.status = newStatus;
            localStorage.setItem('todo', JSON.stringify(this.todos));
            this.updateListeners();
        }
    }

    deleteTodo(todoId: string) {
        const todo = this.todos.find(tod => tod.id === todoId);

        for (let i = 0; i < this.todos.length; i++) {
            if (this.todos[i].id === todo?.id) {
                this.todos.splice(i, 1);
                localStorage.setItem('todo', JSON.stringify(this.todos));
                this.updateListeners();

            }
        }
    }

    editTodo(todoId: string, title: string, dateTime: string) {
        const todo = this.todos.find(tod => tod.id === todoId);
        for (let i = 0; i < this.todos.length; i++) {
            if (this.todos[i].id === todo?.id) {
                this.todos[i].title = title;
                this.todos[i].date = dateTime;
                localStorage.setItem('todo', JSON.stringify(this.todos));
                this.updateListeners();

            }
        }
    }


    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.todos.slice());
        }
    }
}

const todoState = TodoState.getInstance();


// Component Base Class

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    tempalteElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
        this.tempalteElement = document.getElementById(templateId) as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId) as T;
        const importedNode = document.importNode(this.tempalteElement.content, true);
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.render(insertAtStart);
    }
    private render(insertAtBeginning: boolean) {
        this.hostElement!.insertAdjacentElement(
            insertAtBeginning ? 'afterbegin' : 'beforeend',
            this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;

}
// TodoItem Class
class TodoItem extends Component<HTMLUListElement, HTMLLIElement>
    implements SourseTodo {
    private todo: Todo;

    descriptionInputElement: HTMLElement;

    constructor(hostId: string, todo: Todo) {
        super('single-todo', hostId, true, todo.id);
        this.todo = todo;
        this.configure();
        this.renderContent();
        this.descriptionInputElement = this.element.querySelector("h4") as HTMLElement;
    }

    @autobind
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

    @autobind
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
    @autobind
    editTodoHandler() {
        const todoId = this.element.id;
        this.descriptionInputElement!.setAttribute("contenteditable", "true");
        this.descriptionInputElement!.classList.add('form-control');
        this.element.querySelector("#edit-todo")!.classList.add('hidden');
        this.element.querySelector("#update-todo")!.classList.remove('hidden');
    }
    @autobind
    updateTodoHandler() {
        const todoId = this.element.id;
        const userInput = this.gatherUserInput()
        const dateTime: string = new Date().toDateString();
        if (Array.isArray(userInput)) {
            const [desc] = userInput;
            todoState.editTodo(todoId, desc, dateTime);
        }
    }
    @autobind
    configure() {
        this.element.querySelector("#update-todo")!.addEventListener('click', this.updateTodoHandler);
        this.element.querySelector("#edit-todo")!.addEventListener('click', this.editTodoHandler);
        this.element.querySelector("#delete-todo")!.addEventListener('click', this.deleteTodoHandler);
        this.element.querySelector('input')!.addEventListener('change', this.setCompleteHandler)
    }

    renderContent() {

        this.element.querySelector('h4')!.textContent = this.todo.title;
        this.element.querySelector('small')!.textContent = this.todo.date;
    }
    private gatherUserInput(): [string] | undefined {
        const enterDescription = this.descriptionInputElement.innerHTML;

        if (enterDescription.trim().length === 0) {
            swal("invalid input", "Please try again", "error");
            return;
        }
        else
            return [enterDescription];
    }

}

//TodoList class
class TodoList extends Component<HTMLDivElement, HTMLElement>
{

    assignedTodos: Todo[];
    constructor(private type: 'active' | 'finished') {
        super('todo-list', 'todo-container', false, `${type}-todos`);

        this.assignedTodos = [];

        this.configure();
        this.renderContent();

    }


    configure() {

        todoState.addListener((todos: Todo[]) => {
            const relevantTodos = todos.filter(tod => {
                if (this.type === 'active') {
                    return tod.status === TodoStatus.Active;
                }
                return tod.status === TodoStatus.Finished;
            })

            this.assignedTodos = relevantTodos;
            this.renderTodos();
        });
    };
    renderContent() {
        const listId = `${this.type}-todo-list`;
        this.element.querySelector('ul')!.id = listId;
        if (this.type === 'active') {
            this.element.querySelector('label')!.className = 'text-warning';
            this.element.querySelector('label')!.innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${this.type} todos`;
            
        }
        else {
            this.element.querySelector('label')!.className = 'text-success';
            this.element.querySelector('label')!.innerHTML = `<i class="fa fa-check"></i> ${this.type} todos`;
        }

    }
    private renderTodos() {
        const listEl = document.getElementById(`${this.type}-todo-list`) as HTMLUListElement;
        listEl.innerHTML = '';
        for (const todoItem of this.assignedTodos) {
            new TodoItem(this.element.querySelector('ul')!.id, todoItem);
        }
    }
}

// Todo Class
class TodoInput extends Component<HTMLDivElement, HTMLFormElement> {
    descriptionInputElement: HTMLTextAreaElement;

    constructor(public template: string, public elem: string) {
        super(template, elem, true);
        this.descriptionInputElement = this.element.querySelector("#description") as HTMLTextAreaElement;
        this.configure();
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler)
        window.addEventListener('load', this.documentLoadHandlier);
    }

    renderContent() { }

    private gatherUserInput(): [string] | undefined {
        const enterDescription = this.descriptionInputElement.value;
        const descriptionValidatable: Validatable = {
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
    private clearInput() {
        this.descriptionInputElement.value = '';
    }
    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput()
        const dateTime: string = new Date().toDateString();

        if (Array.isArray(userInput)) {
            const [desc] = userInput;
            todoState.addTodo(desc, dateTime);

            this.clearInput();
        }

    }
    private documentLoadHandlier() {
        todoState.getTodo();
    }

}