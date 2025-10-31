import { TestBed } from '@angular/core/testing';
import { TaskDetailsComponent } from './task-details.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '../../services/tasks.service';
import { of, Subject, throwError } from 'rxjs';
import { Task } from '../../models/task.models';

function createActivatedRoute(params: { id?: string }, query: { edit?: string } = {}) {
  return {
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'id' ? params.id ?? null : null)
      },
      queryParamMap: {
        get: (key: string) => (key === 'edit' ? (query.edit ?? null) : null)
      }
    }
  } as unknown as ActivatedRoute;
}

describe('TaskDetailsComponent', () => {
  let tasksSpy: jest.Mocked<TasksService>;
  let routerSpy: any;

  const sampleTask: Task = {
    Id: 1,
    Title: 'Test',
    Description: 'Desc',
    DueDate: new Date('2024-01-01').toISOString(),
    IsCompleted: false
  };

  beforeEach(() => {
    tasksSpy = {
      getTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn()
    } as unknown as jest.Mocked<TasksService>;
    routerSpy = { navigateByUrl: jest.fn() } as unknown as Router;
  });

  it('should set error for invalid id', async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: 'abc' }) }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;

    expect(comp.error()).toBe('Invalid task id.');
    expect(comp.loading()).toBe(false);
  });

  it('should fetch task on init and allow startEdit via query param', async () => {
    (tasksSpy.getTask as jest.Mock).mockReturnValue(of(sampleTask));

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: '1' }, { edit: '1' }) }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;

    expect(tasksSpy.getTask).toHaveBeenCalledWith(1);
    expect(comp.task()).toEqual(sampleTask);
    expect(comp.isEditing()).toBe(true);
    expect(comp.editTitle).toBe(sampleTask.Title);
  });

  it('should set error when fetch fails', async () => {
    (tasksSpy.getTask as jest.Mock).mockReturnValue(throwError(() => new Error('x')));

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: '1' }) }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;

    expect(comp.error()).toBe('Failed to load task details.');
    expect(comp.loading()).toBe(false);
  });

  it('should save edit and refetch on success', async () => {
    // emulate delayed get to verify refresh
    const getSubject = new Subject<Task>();
    (tasksSpy.getTask as jest.Mock).mockReturnValue(getSubject.asObservable());
    (tasksSpy.updateTask as jest.Mock).mockReturnValue(of(sampleTask));

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: '1' }) }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;

    // complete initial fetch
    getSubject.next(sampleTask);
    getSubject.complete();

    comp.startEdit();
    comp.editTitle = 'New';
    comp.saveEdit();

    expect(tasksSpy.updateTask).toHaveBeenCalledWith(1, {
      title: 'New',
      description: sampleTask.Description,
      dueDate: expect.any(String) as any
    });
    expect(tasksSpy.getTask).toHaveBeenCalledTimes(2); // initial + refresh
    expect(comp.isEditing()).toBe(false);
  });

  it('should set error on save failure', async () => {
    (tasksSpy.getTask as jest.Mock).mockReturnValue(of(sampleTask));
    (tasksSpy.updateTask as jest.Mock).mockReturnValue(throwError(() => new Error('bad')));

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: '1' }) }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;

    comp.startEdit();
    comp.saveEdit();

    expect(comp.error()).toBe('Failed to update task.');
    expect(comp.loading()).toBe(false);
  });

  it('should delete task and navigate to /tasks', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    (tasksSpy.getTask as jest.Mock).mockReturnValue(of(sampleTask));
    (tasksSpy.deleteTask as jest.Mock).mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: '1' }) }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;

    comp.deleteTask();

    expect(tasksSpy.deleteTask).toHaveBeenCalledWith(1);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('should not delete without confirmation and handle delete error', async () => {
    // No delete when not confirmed
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    (tasksSpy.getTask as jest.Mock).mockReturnValue(of(sampleTask));

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TasksService, useValue: tasksSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: createActivatedRoute({ id: '1' }) }
      ]
    }).compileComponents();

    let fixture = TestBed.createComponent(TaskDetailsComponent);
    let comp = fixture.componentInstance;
    comp.deleteTask();
    expect(tasksSpy.deleteTask).not.toHaveBeenCalled();

    // Now confirm but fail
    confirmSpy.mockReturnValue(true);
    (tasksSpy.deleteTask as jest.Mock).mockReturnValue(throwError(() => new Error('x')));

    fixture = TestBed.createComponent(TaskDetailsComponent);
    comp = fixture.componentInstance;
    comp.deleteTask();
    expect(comp.error()).toBe('Failed to delete task.');
    expect(comp.loading()).toBe(false);
  });
});
