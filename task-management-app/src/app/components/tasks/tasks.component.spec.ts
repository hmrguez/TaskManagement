import { TestBed } from '@angular/core/testing';
import { TasksComponent } from './tasks.component';
import { TasksService } from '../../services/tasks.service';
import { of, throwError } from 'rxjs';
import { PagedResult, Task } from '../../models/task.models';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';

const paged = (items: Task[], total = items.length): PagedResult<Task> => ({
  Todos: items,
  TotalCount: total,
  PageNumber: 1,
  PageSize: 10
});

describe('TasksComponent', () => {
  let tasksSpy: jest.Mocked<TasksService>;
  let dialogSpy: jest.Mocked<MatDialog>;

  const sampleTasks: Task[] = [
    { Id: 1, Title: 'A', Description: 'd1', IsCompleted: false },
    { Id: 2, Title: 'B', Description: 'd2', IsCompleted: true }
  ];

  beforeEach(async () => {
    tasksSpy = {
      getTasks: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn()
    } as unknown as jest.Mocked<TasksService>;

    dialogSpy = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatDialog>;

    (tasksSpy.getTasks as jest.Mock).mockReturnValue(of(paged(sampleTasks, 20)));

    await TestBed.configureTestingModule({
      imports: [TasksComponent, RouterTestingModule],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();
  });

  it('should fetch tasks on init and map results', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(tasksSpy.getTasks).toHaveBeenCalled();
    expect(comp.tasks().length).toBe(2);
    expect(comp.totalCount()).toBe(20);
    expect(comp.loading()).toBe(false);
    expect(comp.error()).toBeNull();
  });

  it('should handle fetch error', () => {
    (tasksSpy.getTasks as jest.Mock).mockReturnValue(throwError(() => new Error('x')));
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.error()).toBe('Failed to load tasks. Make sure the API is running and you are logged in.');
    expect(comp.loading()).toBe(false);
  });

  it('should apply search and reset page', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    (tasksSpy.getTasks as jest.Mock).mockClear();

    comp.pageNumber.set(3);
    comp.applySearch('foo');
    fixture.detectChanges();

    expect(comp.pageNumber()).toBe(1);
    expect(tasksSpy.getTasks).toHaveBeenCalled();
  });

  it('should paginate with guards', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    // current totalCount = 20, pageSize = 10
    expect(comp.pageNumber()).toBe(1);
    comp.nextPage();
    expect(comp.pageNumber()).toBe(2);
    comp.nextPage(); // should be blocked (2*10 >= 20)
    expect(comp.pageNumber()).toBe(2);
    comp.prevPage();
    expect(comp.pageNumber()).toBe(1);
    comp.prevPage(); // should be blocked
    expect(comp.pageNumber()).toBe(1);
  });

  it('should create task and reset fields', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.newTitle = 'New Task';
    comp.newDescription = 'desc';
    const due = new Date('2024-01-01T00:00:00Z');
    comp.newDueDate = due;

    (tasksSpy.createTask as jest.Mock).mockReturnValue(of({} as any));
    (tasksSpy.getTasks as jest.Mock).mockReturnValue(of(paged(sampleTasks)));

    comp.createTask();

    expect(tasksSpy.createTask).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'desc',
      dueDate: due.toISOString()
    });
    expect(comp.newTitle).toBe('');
    expect(comp.newDescription).toBe('');
    expect(comp.newDueDate).toBeNull();
  });

  it('should not create task if title is blank', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;

    comp.newTitle = '  ';
    comp.createTask();
    expect(tasksSpy.createTask).not.toHaveBeenCalled();
  });

  it('should handle create error', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;

    comp.newTitle = 't';
    (tasksSpy.createTask as jest.Mock).mockReturnValue(throwError(() => new Error('x')));

    comp.createTask();
    expect(comp.error()).toBe('Failed to create task.');
    expect(comp.loading()).toBe(false);
  });

  it('should start, cancel and save edit', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;

    const t: Task = { Id: 1, Title: 'A', Description: 'd', IsCompleted: false };
    comp.startEdit(t);
    expect(comp.editingId).toBe(1);
    expect(comp.editTitle).toBe('A');

    comp.editTitle = 'A2';
    comp.editDescription = 'd2';
    (tasksSpy.updateTask as jest.Mock).mockReturnValue(of({} as any));
    (tasksSpy.getTasks as jest.Mock).mockReturnValue(of(paged(sampleTasks)));

    comp.saveEdit(t);
    expect(tasksSpy.updateTask).toHaveBeenCalledWith(1, {
      title: 'A2',
      description: 'd2',
      dueDate: undefined
    });
    expect(comp.editingId).toBeNull();

    // cancel
    comp.startEdit(t);
    comp.cancelEdit();
    expect(comp.editingId).toBeNull();
  });

  it('should handle save edit error', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    const t: Task = { Id: 1, Title: 'A', Description: 'd', IsCompleted: false };
    comp.startEdit(t);
    (tasksSpy.updateTask as jest.Mock).mockReturnValue(throwError(() => new Error('x')));

    comp.saveEdit(t);
    expect(comp.error()).toBe('Failed to update task.');
    expect(comp.loading()).toBe(false);
  });

  it('should toggle completed', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    const t: Task = { Id: 1, Title: 'A', Description: 'd', IsCompleted: false };
    (tasksSpy.updateTask as jest.Mock).mockReturnValue(of({} as any));
    (tasksSpy.getTasks as jest.Mock).mockReturnValue(of(paged(sampleTasks)));

    comp.toggleCompleted(t);
    expect(tasksSpy.updateTask).toHaveBeenCalledWith(1, { isCompleted: true });
  });

  it('should handle toggle error', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    const t: Task = { Id: 1, Title: 'A', Description: 'd', IsCompleted: false };
    (tasksSpy.updateTask as jest.Mock).mockReturnValue(throwError(() => new Error('x')));

    comp.toggleCompleted(t);
    expect(comp.error()).toBe('Failed to update task status.');
  });

  it('should delete task with confirm and handle error', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const comp = fixture.componentInstance;
    const t: Task = { Id: 1, Title: 'A', Description: 'd', IsCompleted: false };

    // no confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    comp.deleteTask(t);
    expect(tasksSpy.deleteTask).not.toHaveBeenCalled();

    // confirm success
    confirmSpy.mockReturnValue(true);
    (tasksSpy.deleteTask as jest.Mock).mockReturnValue(of(void 0));
    (tasksSpy.getTasks as jest.Mock).mockReturnValue(of(paged(sampleTasks)));
    comp.deleteTask(t);
    expect(tasksSpy.deleteTask).toHaveBeenCalledWith(1);

    // confirm failure
    (tasksSpy.deleteTask as jest.Mock).mockReturnValue(throwError(() => new Error('x')));
    comp.deleteTask(t);
    expect(comp.error()).toBe('Failed to delete task.');
  });
});
