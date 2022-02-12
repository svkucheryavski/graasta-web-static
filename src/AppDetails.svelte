<script>
   import {createEventDispatcher} from "svelte";

   export let id;
   export let title;
   export let info;
   export let help = undefined;
   export let video = undefined;

   const dispatch = createEventDispatcher();
</script>

<div class="app-details">
   <span class="app-id">{id}</span>
   <div class="app-info">
      <h3>{title}</h3>
      <p>{info}</p>
      <div class="toolbar">
         <span title="Run demo" on:click={() => dispatch("showdemo", {id, title, video, help})}>Try</span>
         <a title="Download" href="/apps/{id}.zip">Download</a>
      </div>
   </div>
</div>

<style>

   .app-details {
      padding: 1.0em 0 1.0em 0.5em;
      font-size: 0.9em;
      display: flex;
      flex-direction: row;
      padding-bottom: 1em;
   }


   h3 {
      font-size: 1em;
      color: #707070;
      line-height: 1em;
      margin: 0;
      padding: 0;
   }

   .app-id {
      box-sizing: border-box;
      flex: 0 0 72px;
      font-size: 0.85em;
      line-height: 1.2em;
      text-align: center;
      color: #a0a0a0;
      display: block;
      padding-right: 10px;
   }

   .app-details:hover {
      background: #fafafa;
   }

   .app-details:hover > .app-id {
      color: #ff9900;
   }

   .app-details:hover > .app-info > h3 {
      color: #101010;
   }

   .app-details:hover > .app-info > p {
      color: #606060;
   }

   .app-details:hover  .toolbar > * {
      color: #808080;
      background: #f8f8f8;
      border: 1px solid #d0d0d0;
   }

   .app-info {
      flex: 0 1 auto;
      display: block;
   }

   .toolbar {
      height: auto;
      display: block;
      margin: 0;
      padding: 0;
   }

   .toolbar > span, a {
      display: inline;

      color: #a0a0a0;
      font-weight: normal;
      font-size: 0.75em;
      text-decoration: none;

      padding: 1px 5px;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 3px;

      margin: 0;
      margin-right: 3px;
      cursor: pointer;
   }

   .app-details:hover  .toolbar > *:hover {
      background: #ff9900;
      color: #fafafa;
      border: 1px solid #ff9900;
   }

   p {
      line-height: 1em;
      font-size: 0.8em;
      color: #909090;
      margin: 0;
      padding: 0.75em 0;
   }
</style>