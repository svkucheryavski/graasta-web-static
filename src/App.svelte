<script>
   import AppBlock from "./AppBlock.svelte";
   import AppDemo from "./AppDemo.svelte";
   import appBlocks from "../public/apps/apps";

   let demoOn = false;
   let appID = undefined;
   let searchStr = "";

   function showDemo(e) {
      appID = e.detail;
      demoOn = true;
      document.querySelector("body").style.overflow = "hidden";
   };

   function closeDemo(e) {
      document.querySelector("body").style.overflow = "auto";
      demoOn = false
      appID = undefined;
   };

   function resetSearch(e = undefined) {
      if (e === undefined || e.key === 'Escape') searchStr = "";
   }

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

{#if demoOn && appID}
<AppDemo id={appID} on:close={closeDemo} />
{/if}

<div class="search-block">
   <input on:keydown={resetSearch} placeholder="Enter a single keyword (e.g. interval)" bind:value={searchStr} />
   <button class:hidden={searchStr.length < 1} on:click={() => resetSearch(undefined)}>&times;</button>
   <span>{appListInfo}</span>
</div>

{#each appBlocksShow.filter(v => v.apps.length > 0) as appBlock}
<AppBlock {...appBlock} on:showdemo={showDemo} />
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