import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const mockUser    = { id:1, nombre:'Juan', email:'juan@test.com', rol:'cliente' };
  const mockToken   = 'mock.jwt.token';
  const mockResponse = { token: mockToken, usuario: mockUser };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('isLoggedIn() debe ser false sin token', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('login() debe guardar token y usuario en localStorage', () => {
    service.login({ email:'juan@test.com', password:'123456' }).subscribe(res => {
      expect(res.token).toBe(mockToken);
      expect(localStorage.getItem('se_token')).toBe(mockToken);
    });
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('isLoggedIn() debe ser true tras login exitoso', () => {
    service.login({ email:'juan@test.com', password:'123456' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('currentUser() debe retornar el usuario tras login', () => {
    service.login({ email:'juan@test.com', password:'123456' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);
    expect(service.currentUser()?.email).toBe('juan@test.com');
  });

  it('isAdmin() debe ser false para rol cliente', () => {
    service.login({ email:'juan@test.com', password:'123456' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);
    expect(service.isAdmin()).toBeFalse();
  });

  it('isAdmin() debe ser true para rol admin', () => {
    const adminResponse = { token: mockToken, usuario: { ...mockUser, rol:'admin' } };
    service.login({ email:'admin@sabor.ec', password:'admin123' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(adminResponse);
    expect(service.isAdmin()).toBeTrue();
  });

  it('getToken() debe retornar el token almacenado', () => {
    localStorage.setItem('se_token', mockToken);
    expect(service.getToken()).toBe(mockToken);
  });

  it('register() debe llamar al endpoint correcto con POST', () => {
    const regData = { nombre:'Ana', apellido:'García', email:'ana@test.com', password:'123456' };
    service.register(regData).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(regData);
    req.flush(mockResponse);
  });
});
