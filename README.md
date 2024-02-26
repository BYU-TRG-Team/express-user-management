# Express User Management

Library to extend an Express.js HTTP REST API with user management functionality. The library includes:

- PostgreSQL migrations 
- Authorization middleware
- Endpoints for authentication and user management

**NOTE: This library is now deprecated and is no longer published as an NPM package**

A version can be published to a branch in this repo on an as needed basis using the following instructions:

```
# Checkout new local branch
TARGET_RELEASE_VERSION=<release version>
git checkout -b "release/v${TARGET_RELEASE_VERSION}"
git reset --hard "v${TARGET_RELEASE_VERSION}"

# Build library
npm ci
npm run build
rm .gitignore
cat .npmignore | xargs rm -rf

# Commit changes
git add .
git commit -m "Release ${TARGET_RELEASE_VERSION} (published)" --no-verify

# Push branch to remote and add tag
git push origin "release/v${TARGET_RELEASE_VERSION}"
git tag "release-${TARGET_RELEASE_VERSION}"
git push origin "release-${TARGET_RELEASE_VERSION}"
```

## Authorization Structure

There are four roles available that can be assigned to a user:

- Admin (role_id = 3)
- Staff (role_id = 2)
- User (role_id = 1)
- Inactive (role_id = 0)

## Running PostgreSQL Migrations

This library is built to work with PostgreSQL. Migrations can be run using the following commands once the package is installed.

### Migrate up
```
npm explore @byu-trg/express-user-management -- npm run migrate up
```

### Migrate down
```
npm explore @byu-trg/express-user-management -- npm run migrate down
```

## Authorization Middleware

### verifyToken

Verifies JWT with server-side stored auth secret. Should be present on any endpoint that requires authorization.

**NOTE**: This middleware stores the decrypted JWT on the Express request object. Since the other middleware depend on the JWT being available on the request object, **this middleware must be used first**.

```
const verifyToken =
(
  authSecret: string
) => 
(
  req: Request, 
  res: Response, 
  next: NextFunction
) => {}
```

### checkVerification

Checks that the requester has been verified via email. 

```
const checkVerification = 
(
  req: Request, 
  res: Response, 
  next: NextFunction
) => {}
```

### checkRole

Verifies that the requester has one of the inputted roles. 

```
const checkRole = 
(
  roles: Role[]
) => 
(
  req: Request, 
  res: Response, 
  next: NextFunction
) => {}
```

## Extending Express app with user management endpoints

The default export of the library is a constructor function for the user management endpoints and associated dependencies. The constructor takes the Express app, a [Winston](https://www.npmjs.com/package/winston) logger, a [Nodemailer](https://nodemailer.com/about/) transporter instance, as well as some other configuration variables. 

### Example instantiation

```
const app = express();

const smtpTransporter = nodemailer.createTransport({
    service: smtpConfig.provider,
    secure: true,
    auth: {
      user: smtpConfig.email,
      pass: smtpConfig.password,
    },
  });
  
constructUserManagementAPI(
  app,
  {
    logger,
    smtpConfig: {
      transporterConfig: smtpTransporter.transporter,
      email: smtpConfig.email,
    },
    authConfig: {
      secret: process.env.AUTH_SECRET as string
    },
    dbConfig: {
      connectionString: dbConfig.connectionString,
      ssl: process.env.APP_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  }
)
```


### Endpoints
Parameters are required unless otherwise specified.

<br />

#### Authentication

---
<details>
  <summary>
    Sign Up
  </summary>

  ### URL
  /api/auth/signup

  ### HTTP METHOD
  POST

  ### Params
  @username
  <br />
  @email
  <br />
  @password
  <br />
  @name
  <br />

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Body must include username, email, password, and name"
  }
  ```

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---
<details>
  <summary>
    Sign In
  </summary>

  ### URL
  /api/auth/signin

  ### HTTP METHOD
  POST

  ### Params
  @username
  <br />
  @password
  <br />

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Body must include a username and password"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Username or password is incorrect. Please try again."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    token: <User JWT>
  }
  ```
</details>

---

<details>
  <summary>
    Logout
  </summary>

  ### URL
  /api/auth/logout

  ### HTTP METHOD
  GET

  ### Responses
  
  ```
  Status Code: 200 (Success)

  Body: {}
  ```
</details>

---

<details>
  <summary>
    Process Email Verification Token
  </summary>

  ### URL
  /api/auth/verify/:token

  ### HTTP METHOD
  GET

  ### Responses
  
  ```
  Status Code: 302 (redirect)

  Redirect URL: /login
  ```
</details>

---

<details>
  <summary>
    Initiate Password Recovery
  </summary>

  ### URL
  /api/auth/recovery

  ### HTTP METHOD
  POST

  ### Params
  @email
  <br />

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Body must include email"
  }
  ```

  ```
  Status Code: 302 (Redirect)

  Redirect URL: /recover/sent
  ```
</details>

---

<details>
  <summary>
   Verify Password Recovery Token
  </summary>

  ### URL
  /api/auth/recovery/verify/:token

  ### HTTP METHOD
  POST

  ### Params
  @email
  <br />

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Something went wrong on our end. Please try again."
  }
  ```

  ```
  Status Code: 302 (Redirect)

  Redirect URL: /recover/:token
  ```
</details>

---

<details>
  <summary>
  Process Password Recovery
  </summary>

  ### URL
  /api/auth/recovery/:token

  ### HTTP METHOD
  POST

  ### Params
  @password
  <br />

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Body must include password"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Something went wrong on our end. Please try again."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    token: <User JWT>;
  }
  ```
</details>

---

<br />

#### User Management

User Schema:

```
{
  user_id: UUID;
  username: string;
  verified: boolean;
  password: string;
  email: string;
  name: string;
  role_id: Role;
}
```

---

<details>
  <summary>
    Update User
  </summary>

  ### URL
  /api/user/:id

  ### HTTP METHOD
  PATCH

  ### Params
  @username (optional)
  <br />
  @email (optional)
  <br />
  @name (optional)
  <br />
  @password (optional)
  <br />
  @roleId (optional)
  <br />


  ### Notes
  For all parameters except **roleId**, updates will only be made if the requester is **the same user as the resource**. 

  The **roleId** parameter can be updated for any user as long as the requester has the **Admin** role. 

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Body must include password"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Something went wrong on our end. Please try again."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    newToken: <User JWT>;
  }
  ```
</details>

---

<details>
  <summary>
    Get User
  </summary>

  ### URL
  /api/user/:id

  ### HTTP METHOD
  GET

  ### Notes
  User will only be retrieved if the **requester is the same user as the resource**.

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    message: "Something went wrong on our end. Please try again."
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    message: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    email: string;
    username: string;
    name: string;
  }
  ```
</details>

---

<details>
  <summary>
    Get Users
  </summary>

  ### URL
  /api/users

  ### HTTP METHOD
  GET

  ### Allowed Roles
  Admin

  ### Responses
  ```
  Status Code: 200 (Success)

  Body: {
    users: User[]
  }
  ```
</details>

--- 

<details>
  <summary>
    Delete User
  </summary>

  ### URL
  /api/user/:id

  ### HTTP METHOD
  DELETE

  ### Allowed Roles
  Admin

  ### Responses
  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---



