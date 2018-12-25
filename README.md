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
