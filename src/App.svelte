<script>
   import AppBlock from "./AppBlock.svelte";
   import AppDemo from "./AppDemo.svelte";
   import appBlocks from "../public/apps/apps";

   let demoOn = false;        // status for demo window
   let demoTab = "";          // current tab for demo window
   let appInfo = undefined;   // current app for demo window
   let searchStr = "";        // seach string with keyword

   // shows demo modal window with the app
   function showDemo(id, tab) {
      appInfo = getAppInfoById(id);

      // no app found - clean the hash url and return
      if (!appInfo) {
         location.hash = "";
         return;
      }

      // check that tab name is correct, if not - force tab to "app"
      if (!["app", "video", "info"].includes(tab)) tab = "app";

      // if tabe name is "video" but video is not available - force tab to "app"
      if (tab == "video" && appInfo.video === "") tab = "app";

      // show the modal with app demo
      demoOn = true;
      demoTab = tab ? tab : "app";
      document.querySelector("body").style.overflow = "hidden";
   };

   // closes demo modal window and cleans all related parameters
   function closeDemo(e) {
      document.querySelector("body").style.overflow = "auto";
      demoOn = false;
      location.hash = "";
      demoTab = "";
      appInfo = undefined;
   };

   // cleans search results
   function resetSearch(e = undefined) {
      if (e === undefined || e.key === 'Escape') searchStr = "";
   }

   // search the app by ID and returns its details
   function getAppInfoById(id) {

      const res = appBlocks
         // in every app block search for app by its ID
         .map(v => ({apps: v.apps.filter(a => "#" + a.id === id)}))
         // remove empty blocks and extract app info
         .filter(v => v.apps.length > 0);

      if (res.length === 0 || res[0].apps.length === 0) return null;

      return res[0].apps[0];
   }

   // detect changes in hash url and do routing
   function routeChange() {

      // no hash - close demo
      if (location.hash === "") {
         if (demoOn) closeDemo();
         return;
      }

      // parse URL to get app ID and tab name if any
      const hashElements = location.hash.split("/");
      const appId = hashElements[0];
      const demoTab = hashElements[1];

      // no app found - close demo if any and return
      if (appId === "") {
         if (demoOn) closeDemo();
         return;
      }

      showDemo(appId, demoTab)
   }

   // interactive search procedure
   $: appBlocksShow = searchStr.length > 1 ?
      appBlocks.map(v => ({
         title: v.title, apps: v.apps.filter(
            a => a.title.toLowerCase().search(searchStr.toLowerCase()) >= 0 |
                  a.info.toLowerCase().search(searchStr.toLowerCase()) >= 0
         )
      }))
      : appBlocks;

   $: numApps = appBlocksShow.reduce((v, c) => parseInt(v) + c.apps.length, 0);
   $: appListInfo =  searchStr.length > 0 ? `Found ${numApps} app${numApps > 1 ? "s" : ""}` : `${numApps} apps in the list.`;
</script>

<svelte:window on:load={routeChange} on:hashchange={routeChange} />

<!-- demo modal window -->
{#if demoOn && appInfo}
<AppDemo {...appInfo} tab={demoTab} on:close={() => (location.hash = "")}  />
{/if}

<!-- search block -->
<div class="search-block">
   <input on:keydown={resetSearch} placeholder="Enter a single keyword (e.g. interval)" bind:value={searchStr} />
   <button class:hidden={searchStr.length < 1} on:click={() => resetSearch(undefined)}>&times;</button>
   <span>{appListInfo}</span>
</div>

<!-- list with application blocks -->
{#each appBlocksShow.filter(v => v.apps.length > 0) as appBlock}
<AppBlock {...appBlock} />
{/each}

<style>

.hidden {
   visibility: hidden;
}

.search-block {
   display: flex;
   justify-content: flex-start;
   align-items: center;
   padding: 1em 0;
   width: 100%;
}

.search-block > button {
   flex: 0 0 20px;
   width: 20px;
   height: 20px;
   line-height: 20px;
   font-size: 1.2em;
   font-weight: bold;
   margin: 0 0 0 5px;
   padding: 0;
   border-radius: 50%;
   box-shadow: none;
   outline: none !important;
   border: none;
   color: #998044;
   background: transparent;
}

.search-block > span {
   flex: 1 0 100px;
   display: block;
   padding-left: 1em;
   color: #808080;
   font-size: 1.1em;
   height: 100%;
}

.search-block > input {
   flex: 0 0 50%;
   font-size: 1rem;
   padding: 0.5em;
   border: solid 1px #c8c8c8;
   background: #fafafa;
   color: #808080;
   border-radius: 5px;
   width: 50%;
   margin: 0 auto;
   box-shadow: none;
}

.search-block > input:focus {
   outline: none !important;
   border: solid 1px #99804460;
   background: #99804410;
   color: #998044;
}

.search-block > input::placeholder {
   color: #bababa;
}

.search-block > input:focus::placeholder {
   color: #99804480;
}

</style>