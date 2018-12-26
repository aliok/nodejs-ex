# Local

```
cd config
docker-compose rm --force
docker-compose up
```

* Open [http://localhost:8080/auth/admin/](http://localhost:8080/auth/admin/) and login with the user `admin` and password `admin`.
* Click **Add Realm** and click **Select File** next to the **Import** label.
* Select the [examples/keycloak/config/realm-export.json](../../examples/keycloak/config/realm-export.json) file and click **Create**.
* Click **Users** and add a new user called `developer`. You can choose your own name if you wish.
* Under the **Credentials** tab add a new password of **developer** and make sure it is not temporary. You can choose your own password if you wish.
* Under the **Role Mappings** tab assign the **admin** realm role.
* Select the **voyager-testing** option from the **Client Roles** dropdown and assign the **admin** role.

 
```
PORT=4000 node server.js
```

Open [http://localhost:4000/graphql](http://localhost:4000/graphql) and you will be redirected to a login page. Log in with the user that was created earlier you should now see the the GraphQL playground.

In the playground you will see an error.

```json
{
  "error": "Failed to fetch schema. Please check your connection"
}
```

Do not worry, this error is caused by the playground making unauthenticated requests. One more step is needed.

In a new tab, open [http://localhost:4000/token](http://localhost:4000/token). You should see a JSON result.

```json
{"Authorization":"Bearer <Long String of Characters>"}
```

Copy the entire JSON result to your clipboard and navigate back to the Playground at [http://localhost:4000/graphql](http://localhost:4000/graphql). 

In the Playground, click the **HTTP Headers** button and paste the JSON result into the input box. If successful, the error will disappear and it is now possible to make queries.

Try out the following query

```
query hello {
  hello
}
```


# OpenShift
Add aerogearcatalog to ASB config
Set other required config in ASB configmap

Provision Keycloak
Import the `realm-export.json` (same as above in "Local")
Create user (same as above in "Local")

In OpenShift console:
* Add to Project
* Browse Catalog
* Languages --> Javascript --> Node.js
* Try Sample Repository, but with Git Repository https://github.com/aliok/nodejs-ex.git
* Advanced options
* Deployment Configuration --> create env var KEYCLOAK_ROUTE: <your Keycloak URL, e.g. https://keycloak-5ddec1-bbb.apps.auditlogs-27e0.openshiftworkshop.com>
* Create
* Wait for the build and the deployment to finish

Go to <node app route>/graphql and do the same as local (/token etc.)





# Creating random data

See https://github.com/aliok/aerogear-sync-metrics-generator
Adapt the `url` and the `options['headers']` in `index.js.