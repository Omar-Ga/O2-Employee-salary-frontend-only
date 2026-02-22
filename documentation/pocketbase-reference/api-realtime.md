The Realtime API is implemented via Server-Sent Events (SSE). Generally, it consists of 2 operations:


<ol>
    - establish SSE connection

    - submit client subscriptions

</ol>



    SSE events are sent for **create**, **update**
    and **delete** record operations.



> 


>             **You could subscribe to a single record or to an entire collection.**
>         


>         


>             When you subscribe to a **single record**, the collection's
>             **ViewRule** will be used to determine whether the subscriber has access to receive the
>             event message.
>         


>         


>             When you subscribe to an **entire collection**, the collection's
>             **ListRule** will be used to determine whether the subscriber has access to receive the
>             event message.
>         





    <Accordion single title="Connect">
        

            <strong class="label label-primary">GET</strong>
            
/api/realtime

        


        


            Establishes a new SSE connection and immediately sends a `PB_CONNECT` SSE event with the
            created client ID.
        


        


            **NB!** The user/superuser authorization happens during the first
            [Set subscriptions](/docs/api-realtime#set-subscriptions)
            call.
        


        


            If the connected client doesn't receive any new messages for 5 minutes, the server will send a
            disconnect signal (this is to prevent forgotten/leaked connections). The connection will be
            automatically reestablished if the client is still active (e.g. the browser tab is still open).
        


    



    <Accordion single title="Set subscriptions">
        

            <strong class="label label-primary">POST</strong>
            
/api/realtime

        


        

            

Sets new active client's subscriptions (and auto unsubscribes from the previous ones).


            


                If `Authorization` header is set, will authorize the client SSE connection with the
                associated user or superuser.
            


        


        
Body Parameters

        

            

                

                    
Param

                    
Type

                    
Description

                

            

            

                

                    

                        

                            
Required

                            
clientId

                        

                    

                    

                        
String

                    

                    
ID of the SSE client connection.

                

                

                    

                        

                            
Optional

                            
subscriptions

                        

                    

                    

                        
{"Array<String>"}

                    

                    

                        


                            The new client subscriptions to set in the format:
                            

                            `COLLECTION_ID_OR_NAME/*` or
                            `COLLECTION_ID_OR_NAME/RECORD_ID`.
                        


                        


                            You can also attach optional query and header parameters as serialized json to a
                            single topic using the `options`
                            query parameter, e.g.:
                            

```javascript
COLLECTION_ID_OR_NAME/RECORD_ID?options={"query": {"abc": "123"}, "headers": {"x-token": "..."}}
```


                        


                        

Leave empty to unsubscribe from everything.


                    

                

            

        

        <small class="block txt-hint m-t-10 m-b-base">
            Body parameters could be sent as *JSON* or
            *multipart/form-data*.
        </small>

        
Responses

        

            

                {#each responses as response (response.code)}
                    <button
                        class="tab-item"
                        class:active={responseTab === response.code}
                        on:click={() => (responseTab = response.code)}
                    >
                        {response.code}
                    </button>
                {/each}
            

            

                {#each responses as response (response.code)}
                    

                        

```javascript
response.body
```


                    

                {/each}
            

        

    







    All of this is seamlessly handled by the SDKs using just the `subscribe` and
    `unsubscribe` methods:


<CodeTabs
    js={`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // (Optionally) authenticate
        await pb.collection('users').authWithPassword('test@example.com', '1234567890');

        // Subscribe to changes in any record in the collection
        pb.collection('example').subscribe('*', function (e) {
            console.log(e.action);
            console.log(e.record);
        }, { /* other options like expand, custom headers, etc. */ });


        // Subscribe to changes only in the specified record
        pb.collection('example').subscribe('RECORD_ID', function (e) {
            console.log(e.action);
            console.log(e.record);
        }, { /* other options like expand, custom headers, etc. */ });


        // Unsubscribe
        pb.collection('example').unsubscribe('RECORD_ID'); // remove all 'RECORD_ID' subscriptions
        pb.collection('example').unsubscribe('*'); // remove all '*' topic subscriptions
        pb.collection('example').unsubscribe(); // remove all subscriptions in the collection
    `}
    dart={`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        // (Optionally) authenticate
        await pb.collection('users').authWithPassword('test@example.com', '1234567890');

        // Subscribe to changes in any record in the collection
        pb.collection('example').subscribe('*', (e) {
            print(e.action);
            print(e.record);
        }, /* other options like expand, custom headers, etc. */);


        // Subscribe to changes only in the specified record
        pb.collection('example').subscribe('RECORD_ID', (e) {
            print(e.action);
            print(e.record);
        }, /* other options like expand, custom headers, etc. */);


        // Unsubscribe
        pb.collection('example').unsubscribe('RECORD_ID'); // remove all 'RECORD_ID' subscriptions
        pb.collection('example').unsubscribe('*'); // remove all '*' topic subscriptions
        pb.collection('example').unsubscribe(); // remove all subscriptions in the collection
    `}
/>