import { VendedoresComponent } from './vendedores.component';

describe('VendedoresComponent VND-LOAD-001', () => {
  function createIsolatedComponent(): {
    component: VendedoresComponent;
    showLoading: jasmine.Spy;
    hideLoading: jasmine.Spy;
    getUserInformation: jasmine.Spy;
  } {
    const component = Object.create(VendedoresComponent.prototype) as VendedoresComponent;
    const showLoading = jasmine.createSpy('showLoading').and.returnValue(Promise.resolve());
    const hideLoading = jasmine.createSpy('hideLoading').and.returnValue(Promise.resolve());
    const getUserInformation = jasmine.createSpy('getUserInformation');
    const detectChanges = jasmine.createSpy('detectChanges');

    (component as any).message = { showLoading, hideLoading };
    (component as any).services = { getUserInformation };
    (component as any).cdr = { detectChanges };
    component.userInfo = [];
    component.loadingUserInfo = false;
    component.userInfoLoadFailed = false;

    return { component, showLoading, hideLoading, getUserInformation };
  }

  it('loadUserInfoInBackground does not open global Cargando modal', async () => {
    const { component, showLoading, getUserInformation } = createIsolatedComponent();
    getUserInformation.and.returnValue(Promise.resolve({
      data: { userInfo: [{ coEnterprise: 'E1', diasHabiles: 20 }] },
    }));

    const pending = component.loadUserInfoInBackground();
    expect(showLoading).not.toHaveBeenCalled();
    expect(component.loadingUserInfo).toBe(true);

    await pending;

    expect(component.loadingUserInfo).toBe(false);
    expect(component.userInfo.length).toBe(1);
  });

  it('marks failure without showLoading when HTTP rejects', async () => {
    const { component, showLoading, getUserInformation } = createIsolatedComponent();
    getUserInformation.and.returnValue(Promise.reject(new Error('timeout')));

    const pending = component.loadUserInfoInBackground();
    expect(showLoading).not.toHaveBeenCalled();

    await pending;

    expect(component.userInfoLoadFailed).toBe(true);
    expect(component.loadingUserInfo).toBe(false);
  });

  it('hasMetricsForEnterprise matches coEnterprise', () => {
    const { component } = createIsolatedComponent();
    component.userInfo = [{ coEnterprise: 'DIAZ' } as any];
    expect(component.hasMetricsForEnterprise({ coEnterprise: 'DIAZ' } as any)).toBe(true);
    expect(component.hasMetricsForEnterprise({ coEnterprise: 'OTRA' } as any)).toBe(false);
  });
});
