import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewPotentialClientComponent } from './client-new-potential-client.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('NewPotentialClientComponent', () => {
  let component: NewPotentialClientComponent;
  let fixture: ComponentFixture<NewPotentialClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewPotentialClientComponent],
      imports: [ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(NewPotentialClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with required controls', () => {
    expect(component.newPotentialClient.contains('idEnterprise')).toBeTrue();
    expect(component.newPotentialClient.contains('naClient')).toBeTrue();
    expect(component.newPotentialClient.contains('nuRif')).toBeTrue();
    expect(component.newPotentialClient.contains('txAddress')).toBeTrue();
    expect(component.newPotentialClient.contains('txAddressDispatch')).toBeTrue();
    expect(component.newPotentialClient.contains('txClient')).toBeTrue();
    expect(component.newPotentialClient.contains('naResponsible')).toBeTrue();
    expect(component.newPotentialClient.contains('emClient')).toBeTrue();
    expect(component.newPotentialClient.contains('nuPhone')).toBeTrue();
    expect(component.newPotentialClient.contains('naWebSite')).toBeTrue();
  });

  it('should mark all controls as touched on construction', () => {
    Object.values(component.newPotentialClient.controls).forEach(control => {
      expect(control.touched).toBeTrue();
    });
  });

  it('should clean string correctly', () => {
    const dirtyString = `test;"'string"`;
    const clean = component.cleanString(dirtyString);
    expect(clean).toBe('teststring');
  });

  it('should disable idEnterprise control if not multi enterprise', () => {
    component.isMultiEnterprise = false;
    component.ngOnInit();
    expect(component.newPotentialClient.get('idEnterprise')?.disabled).toBeTrue();
  });

  it('should enable idEnterprise control if multi enterprise', () => {
    component.isMultiEnterprise = true;
    component.ngOnInit();
    expect(component.newPotentialClient.get('idEnterprise')?.enabled).toBeTrue();
  });

  it('should call markAllAsTouched if validation fails', async () => {
    spyOn(component.newPotentialClient, 'markAllAsTouched');
    await component.validatePotentialClient(component.newPotentialClient, false);
    expect(component.newPotentialClient.markAllAsTouched).toHaveBeenCalled();
  });

  it('should set clientLogic.cannotSavePotentialClient to false if form is valid', async () => {
    Object.values(component.newPotentialClient.controls).forEach(control => control.setValue('test'));
    await component.checkForm();
    expect(component.clientLogic.cannotSavePotentialClient).toBeFalse();
  });

  it('should set clientLogic.cannotSavePotentialClient to true if form is invalid', async () => {
    component.newPotentialClient.get('naClient')?.setValue('');
    await component.checkForm();
    expect(component.clientLogic.cannotSavePotentialClient).toBeTrue();
  });

  it('should update potentialClient.naClient on onNaClientChange', () => {
    component.newPotentialClient.get('naClient')?.setValue('test;string');
    component.onNaClientChange();
    expect(component.clientLogic.potentialClient.naClient).toBe('teststring');
  });

  // Puedes agregar pruebas similares para los otros métodos de cambio de campos
});