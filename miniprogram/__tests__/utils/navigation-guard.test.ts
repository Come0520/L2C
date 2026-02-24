import { NavigationGuard } from '../../utils/navigation-guard';
import { authStore } from '../../stores/auth-store';

describe('NavigationGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global as any).wx = {
            navigateTo: vi.fn(),
            reLaunch: vi.fn(),
            navigateBack: vi.fn()
        } as any;
    });

    test('should allow access to public pages without login', () => {
        (authStore as any)._token = '';
        (authStore as any)._userInfo = null;

        NavigationGuard.navigateTo('/pages/login/login');

        expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/login/login' });
        expect(wx.reLaunch).not.toHaveBeenCalled();
    });

    test('should redirect to landing if not logged in for private pages', () => {
        (authStore as any)._token = '';
        (authStore as any)._userInfo = null;

        NavigationGuard.navigateTo('/pages/index/index');

        expect(wx.navigateTo).not.toHaveBeenCalled();
        expect(wx.reLaunch).toHaveBeenCalledWith({ url: '/pages/landing/landing' });
    });

    test('should allow access to private pages if logged in', () => {
        (authStore as any)._token = 'valid-token';
        (authStore as any)._userInfo = { id: '1', role: 'admin' };

        NavigationGuard.navigateTo('/pages/crm/index');

        expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/crm/index' });
    });
});

export { };
