<script>
   import {onMount} from "svelte";

   export let id;
   let appSrc = "";
   let loaded = false;

   onMount(() => {
      // check that url to app demo exists
      const appUrl = "/apps/" + id + "/index.html";
      const  request = new XMLHttpRequest();

      request.open("GET", appUrl, true);
      request.onreadystatechange = function(){
         if (request.readyState === 4){
            console.log(request)
            if (request.status === 404) {
               appSrc = "";
               loaded = false;
            } else {
               appSrc = appUrl;
               loaded = true;
            }
         }
      };
      request.send();
   });
</script>

<iframe title="{id}" src="{appSrc}" width="100%" height="100%">Loading</iframe>

<style>
   iframe {
      border: none;
      width: 100%;
      height: 100%;
   }
</style>