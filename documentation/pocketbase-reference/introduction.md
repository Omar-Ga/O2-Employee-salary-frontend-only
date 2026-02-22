> 


>             Please keep in mind that PocketBase is still under active development and full backward
>             compatibility is not guaranteed before reaching v1.0.0. PocketBase is NOT recommended for
>             production critical applications yet, unless you are fine with reading the
>             <a
>                 href="{import.meta.env.PB_REPO_URL}/blob/master/CHANGELOG.md"
>                 class="txt-bold"
>                 target="_blank"
>                 rel="noopener noreferrer"
>             >
>                 changelog
>             </a>
>             and applying some manual migration steps from time to time.
>         





    PocketBase is an open source backend consisting of embedded database (SQLite) with realtime subscriptions,
    builtin auth management, convenient dashboard UI and simple REST-ish API. It can be used both as Go
    framework and as standalone application.




The easiest way to get started is to download the prebuilt minimal PocketBase executable:





    

        <button
            type="button"
            class="tab-item"
            class:active={architecture == AMD}
            on:click|preventDefault={() => changePlatform(AMD)}
        >
            x64
        </button>
        <button
            type="button"
            class="tab-item"
            class:active={architecture == ARM}
            on:click|preventDefault={() => changePlatform(ARM)}
        >
            ARM64
        </button>
    

    

        

            

                - 
                    

                        <a
                            href={import.meta.env.PB_LINUX_AMD_URL}
                            class="inline-flex flex-gap-5 txt-bold"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i class="ri-qq-fill" />
                            
Download {import.meta.env.PB_VERSION} for Linux x64

                        </a>
                        <small class="txt-hint">(~{import.meta.env.PB_LINUX_AMD_SIZE}MB zip)</small>
                    

                

                - 
                    

                        <a
                            href={import.meta.env.PB_WINDOWS_AMD_URL}
                            class="inline-flex flex-gap-5 txt-bold"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i class="ri-windows-fill" />
                            
Download {import.meta.env.PB_VERSION} for Windows x64

                        </a>
                        <small class="txt-hint">(~{import.meta.env.PB_WINDOWS_AMD_SIZE}MB zip)</small>
                    

                

                - 
                    

                        <a
                            href={import.meta.env.PB_MAC_AMD_URL}
                            class="inline-flex flex-gap-5 txt-bold"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i class="ri-apple-fill" />
                            
Download {import.meta.env.PB_VERSION} for macOS x64

                        </a>
                        <small class="txt-hint">(~{import.meta.env.PB_MAC_AMD_SIZE}MB zip)</small>
                    

                

            

        

        

            

                - 
                    

                        <a
                            href={import.meta.env.PB_LINUX_ARM_URL}
                            class="inline-flex flex-gap-5 txt-bold"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i class="ri-qq-fill" />
                            
Download {import.meta.env.PB_VERSION} for Linux ARM64

                        </a>
                        <small class="txt-hint">(~{import.meta.env.PB_LINUX_ARM_SIZE}MB zip)</small>
                    

                

                - 
                    

                        <a
                            href={import.meta.env.PB_WINDOWS_ARM_URL}
                            class="inline-flex flex-gap-5 txt-bold"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i class="ri-windows-fill" />
                            
Download {import.meta.env.PB_VERSION} for Windows ARM64

                        </a>
                        <small class="txt-hint">(~{import.meta.env.PB_WINDOWS_ARM_SIZE}MB zip)</small>
                    

                

                - 
                    

                        <a
                            href={import.meta.env.PB_MAC_ARM_URL}
                            class="inline-flex flex-gap-5 txt-bold"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i class="ri-apple-fill" />
                            
Download {import.meta.env.PB_VERSION} for macOS ARM64

                        </a>
                        <small class="txt-hint">(~{import.meta.env.PB_MAC_ARM_SIZE}MB zip)</small>
                    

                

            

        

    






    See the
    <a href={import.meta.env.PB_GITHUB_RELEASES_URL} target="_blank" rel="noreferrer noopener">
        GitHub Releases page
    </a>
    for other platforms and more details.



<hr />



    Once you've extracted the archive, you could start the application by running
    `**./pocketbase serve**` in the extracted directory.




    **And that's it!**
    The first time it will generate an installer link that should be automatically opened in the browser to set
    up your first superuser account
    <small class="txt-hint">
        (you can also create the first superuser manually via
        `./pocketbase superuser create EMAIL PASS`)
    </small>.



The started web server has the following default routes:



> 

>             - 
>                 
>                 [
>                     `http://127.0.0.1:8090`
>                 ](http://127.0.0.1:8090)
>                 - if `pb_public` directory exists, serves the static content from it (html, css, images,
>                 etc.)
>             

>             - 
>                 
>                 [
>                     `http://127.0.0.1:8090/_/`
>                 ](http://127.0.0.1:8090/_/)
>                 - superusers dashboard
>             

>             - 
>                 
>                 [
>                     `http://127.0.0.1:8090/api/`
>                 ](http://127.0.0.1:8090/api/)
>                 - REST-ish API
>             

>         



The prebuilt PocketBase executable will create and manage 2 new directories alongside the executable:




    - 
        `pb_data` - stores your application data, uploaded files, etc. (usually should be added in
        `.gitignore`).
    

    - 
        `pb_migrations` - contains JS migration files with your collection changes (can be safely
        committed in your repository).
        

        

            You can even write custom migration scripts. For more info check the
            [JS migrations docs](/docs/js-migrations).
        

    





    You could find all available commands and their options by running
    `./pocketbase --help` or
    `./pocketbase [command] --help`



<style>
    .tabs-architecture .tabs-header .tab-item {
        min-width: 70px;
    }
</style>