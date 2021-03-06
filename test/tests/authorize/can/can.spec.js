import { createCan } from '../../../../src/authorize';
import { systemPolicies } from '../../../utils/authorize';
import { createException } from '../../../../src/utils';

// can is the authorization middleware creator function generated by createCan()
describe('authorize.js - can()', () => {
  let can;
  let express;

  const createCanWithMockParams = () => {
    can = new (function f() {
      this.userPermissionsResolver = jest.fn();
      this.unauthorizedRequestHandler = jest.fn();
      this.authorizationExceptionHandler = jest.fn();

      this.userPermissionsResolver.mockImplementation((req) =>
        req.user.permissions(),
      );
      this.unauthorizedRequestHandler.mockImplementation((req, res) => {
        // this means that the user is not authorized to make the request
        return res
          .status(403)
          .json({ message: 'You are not authorized to perform this action.' });
      });
      this.authorizationExceptionHandler.mockImplementation((req, res) => {
        // this means that an exception was thrown either by userPermissions
        // resolver or authorize() lib function you can log problem or deal
        // with it in any other way your deem fit
        return res
          .status(500)
          .json({ message: 'We are experiencing problems. Try again later.' });
      });

      this.fn = createCan(
        systemPolicies,
        this.userPermissionsResolver,
        this.unauthorizedRequestHandler,
        this.authorizationExceptionHandler,
      );
    })();
  };

  const createExpressMock = () => {
    // create express mock
    express = new (function f() {
      // request mock
      this.request = { user: { permissions: () => ['blog.list', 'bar.g'] } };
      this.resStatus = jest.fn();
      this.resJson = jest.fn();
      // response mock
      this.response = { status: this.resStatus, json: this.resJson };
      this.next = jest.fn();
      // allow chaining of status and json
      this.resJson.mockImplementation(() => this.response);
      this.resStatus.mockImplementation(() => this.response);
      // method to call express middleware
      this.callMiddleware = async (middleware) => {
        await middleware(this.request, this.response, this.next);
      };
    })();
  };

  beforeEach(() => {
    createCanWithMockParams();
    createExpressMock();
  });

  describe('handling of success and failure', () => {
    it('should trigger next() on authorization success', async () => {
      await express.callMiddleware(can.fn('list', 'blog'));

      expect(express.next).toHaveBeenCalledTimes(1);
    });

    it('should trigger unauthorizedRequestHandler() on authorization failure', async () => {
      await express.callMiddleware(can.fn('create', 'blog'));

      expect(express.response.status).toHaveBeenNthCalledWith(1, 403);
      expect(express.response.json).toHaveBeenNthCalledWith(1, {
        message: 'You are not authorized to perform this action.',
      });
    });
  });

  describe('handling exceptions', () => {
    const checkCorrectExecutionOfAuthorizationExceptionHandler = async () => {
      expect(express.response.status).toHaveBeenNthCalledWith(1, 500);
      expect(express.response.json).toHaveBeenNthCalledWith(1, {
        message: 'We are experiencing problems. Try again later.',
      });
    };

    afterEach(async () => {
      await checkCorrectExecutionOfAuthorizationExceptionHandler();
    });

    describe('authorize() triggered exceptions', () => {
      it('should trigger authorizationExceptionHandler() for undefined policy exception', async () => {
        await express.callMiddleware(can.fn('delete', 'report'));

        expect(can.authorizationExceptionHandler).toHaveBeenNthCalledWith(
          1,
          express.request,
          express.response,
          express.next,
          createException('The [report] policy is not defined.'),
        );
      });

      it('should trigger authorizationExceptionHandler() for undefined policy exception', async () => {
        await express.callMiddleware(can.fn('publish', 'blog'));

        expect(can.authorizationExceptionHandler).toHaveBeenCalledTimes(1);
        expect(can.authorizationExceptionHandler).toHaveBeenCalledWith(
          express.request,
          express.response,
          express.next,
          createException(
            'The [blog] policy does not define action [publish].',
          ),
        );
      });

      it('should trigger authorizationExceptionHandler() for unexpected nested promise callbacks', async () => {
        await express.callMiddleware(can.fn('share', 'bar'));

        expect(can.authorizationExceptionHandler).toHaveBeenCalledTimes(1);
        expect(can.authorizationExceptionHandler).toHaveBeenCalledWith(
          express.request,
          express.response,
          express.next,
          createException('Unexpected nested promise callback.'),
        );
      });
    });

    describe('other exceptions', () => {
      it('should trigger authorizationExceptionHandler() when userPermissionsResolver() throws', async () => {
        // override userPermissionsResolver - cause it to throw exception
        can.userPermissionsResolver.mockImplementation(() => {
          throw Error(
            'Something bad happened trying to resolve user permissions.',
          );
        });

        await express.callMiddleware(can.fn('list', 'blog'));

        expect(can.authorizationExceptionHandler).toHaveBeenCalledTimes(1);
        expect(can.authorizationExceptionHandler).toHaveBeenCalledWith(
          express.request,
          express.response,
          express.next,
          Error('Something bad happened trying to resolve user permissions.'),
        );
      });

      it('should trigger authorizationExceptionHandler() when unauthorizedRequestHandler() throws', async () => {
        // override unauthorizedRequestHandler - cause it to throw exception
        can.unauthorizedRequestHandler.mockImplementation(() => {
          throw Error(
            'Something bad happened trying to handle authorization exception.',
          );
        });

        await express.callMiddleware(can.fn('create', 'blog'));

        expect(can.authorizationExceptionHandler).toHaveBeenCalledTimes(1);
        expect(can.authorizationExceptionHandler).toHaveBeenCalledWith(
          express.request,
          express.response,
          express.next,
          Error(
            'Something bad happened trying to handle authorization exception.',
          ),
        );
      });
    });
  });
});
