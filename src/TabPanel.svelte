<script>
   import { onMount, getContext } from 'svelte';

	export let title;
   let domElement;
   const tabs = getContext('tabs');

   onMount(() => {
      tabs.addItem({title: title, domElement: domElement});
   })
</script>

<div bind:this={domElement} class="tab-panel">
   <slot></slot>
</div>

<style>
   .tab-panel  {
      height: 100%;
      width: 100%;
      display: none
   }
</style>
