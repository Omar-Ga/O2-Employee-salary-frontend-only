You can extend the default PocketBase behavior with custom server-side code using the exposed JavaScript
    app event hooks.




    Throwing an error or not calling `e.next()` inside a handler function stops the hook execution chain.



> 


>             All hook handler functions share the same `{`function(e){}`}` signature and expect the
>             user to call `e.next()` if they want to proceed with the execution chain.
>         



<Toc headingSelector="h1, h2, h3, h4, h5" />

{#each eventHooks as group}
    <HeadingLink title={group.title} tag={group.tag || "h3"} />

    {#if group.description}{@html adjustForJS(group.description)}{/if}

    {#if group.hooks}
        

            {#each Object.entries(group.hooks) as [hookTitle, hookInfo]}
                {#if hookInfo.js}
                    <Accordion single title={adjustForJS(hookTitle)}>
                        
{@html adjustForJS(hookInfo.html)}

                        

```javascript
hookInfo.js
```


                    


                {/if}
            {/each}
        

    {/if}
{/each}