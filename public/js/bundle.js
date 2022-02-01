
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/AppDetails.svelte generated by Svelte v3.42.4 */
    const file$4 = "src/AppDetails.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let span0;
    	let t0;
    	let t1;
    	let div1;
    	let h3;
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let t5;
    	let div0;
    	let span1;
    	let t7;
    	let a;
    	let t8;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			span0 = element("span");
    			t0 = text(/*id*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t2 = text(/*title*/ ctx[1]);
    			t3 = space();
    			p = element("p");
    			t4 = text(/*info*/ ctx[2]);
    			t5 = space();
    			div0 = element("div");
    			span1 = element("span");
    			span1.textContent = "Try";
    			t7 = space();
    			a = element("a");
    			t8 = text("Download");
    			attr_dev(span0, "class", "app-id svelte-flsgey");
    			add_location(span0, file$4, 12, 3, 237);
    			attr_dev(h3, "class", "svelte-flsgey");
    			add_location(h3, file$4, 14, 6, 302);
    			attr_dev(p, "class", "svelte-flsgey");
    			add_location(p, file$4, 15, 6, 325);
    			attr_dev(span1, "title", "Run demo");
    			attr_dev(span1, "class", "svelte-flsgey");
    			add_location(span1, file$4, 17, 9, 376);
    			attr_dev(a, "title", "Download");
    			attr_dev(a, "href", a_href_value = "/apps/" + /*id*/ ctx[0] + ".zip");
    			attr_dev(a, "class", "svelte-flsgey");
    			add_location(a, file$4, 18, 9, 461);
    			attr_dev(div0, "class", "toolbar svelte-flsgey");
    			add_location(div0, file$4, 16, 6, 345);
    			attr_dev(div1, "class", "app-info svelte-flsgey");
    			add_location(div1, file$4, 13, 3, 273);
    			attr_dev(div2, "class", "app-details svelte-flsgey");
    			add_location(div2, file$4, 11, 0, 208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, span0);
    			append_dev(span0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t2);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, span1);
    			append_dev(div0, t7);
    			append_dev(div0, a);
    			append_dev(a, t8);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) set_data_dev(t0, /*id*/ ctx[0]);
    			if (dirty & /*title*/ 2) set_data_dev(t2, /*title*/ ctx[1]);
    			if (dirty & /*info*/ 4) set_data_dev(t4, /*info*/ ctx[2]);

    			if (dirty & /*id*/ 1 && a_href_value !== (a_href_value = "/apps/" + /*id*/ ctx[0] + ".zip")) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppDetails', slots, []);
    	let { id } = $$props;
    	let { title } = $$props;
    	let { info } = $$props;
    	let { video = undefined } = $$props;
    	const dispatch = createEventDispatcher();
    	const writable_props = ['id', 'title', 'info', 'video'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppDetails> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("showdemo", id);

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    		if ('video' in $$props) $$invalidate(4, video = $$props.video);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		id,
    		title,
    		info,
    		video,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    		if ('video' in $$props) $$invalidate(4, video = $$props.video);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, title, info, dispatch, video, click_handler];
    }

    class AppDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { id: 0, title: 1, info: 2, video: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppDetails",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppDetails> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<AppDetails> was created without expected prop 'title'");
    		}

    		if (/*info*/ ctx[2] === undefined && !('info' in props)) {
    			console.warn("<AppDetails> was created without expected prop 'info'");
    		}
    	}

    	get id() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get info() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get video() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set video(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppBlock.svelte generated by Svelte v3.42.4 */
    const file$3 = "src/AppBlock.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (13:6) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No apps available in this block.";
    			attr_dev(p, "class", "svelte-i7rmfd");
    			add_location(p, file$3, 13, 6, 264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(13:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:6) {#each apps as app}
    function create_each_block$1(ctx) {
    	let li;
    	let appdetails;
    	let current;
    	const appdetails_spread_levels = [/*app*/ ctx[3]];
    	let appdetails_props = {};

    	for (let i = 0; i < appdetails_spread_levels.length; i += 1) {
    		appdetails_props = assign(appdetails_props, appdetails_spread_levels[i]);
    	}

    	appdetails = new AppDetails({ props: appdetails_props, $$inline: true });
    	appdetails.$on("showdemo", /*showdemo_handler*/ ctx[2]);

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(appdetails.$$.fragment);
    			attr_dev(li, "class", "svelte-i7rmfd");
    			add_location(li, file$3, 11, 6, 199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(appdetails, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appdetails_changes = (dirty & /*apps*/ 2)
    			? get_spread_update(appdetails_spread_levels, [get_spread_object(/*app*/ ctx[3])])
    			: {};

    			appdetails.$set(appdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(appdetails);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(11:6) {#each apps as app}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let article;
    	let h2;
    	let t0;
    	let t1;
    	let ul;
    	let current;
    	let each_value = /*apps*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(h2, "class", "svelte-i7rmfd");
    			add_location(h2, file$3, 8, 3, 142);
    			attr_dev(ul, "class", "svelte-i7rmfd");
    			add_location(ul, file$3, 9, 3, 162);
    			attr_dev(article, "class", "app-block svelte-i7rmfd");
    			add_location(article, file$3, 7, 0, 111);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h2);
    			append_dev(h2, t0);
    			append_dev(article, t1);
    			append_dev(article, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (dirty & /*apps*/ 2) {
    				each_value = /*apps*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(ul, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppBlock', slots, []);
    	let { title } = $$props;
    	let { apps } = $$props;
    	const writable_props = ['title', 'apps'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppBlock> was created with unknown prop '${key}'`);
    	});

    	function showdemo_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('apps' in $$props) $$invalidate(1, apps = $$props.apps);
    	};

    	$$self.$capture_state = () => ({ AppDetails, title, apps });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('apps' in $$props) $$invalidate(1, apps = $$props.apps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, apps, showdemo_handler];
    }

    class AppBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { title: 0, apps: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppBlock",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !('title' in props)) {
    			console.warn("<AppBlock> was created without expected prop 'title'");
    		}

    		if (/*apps*/ ctx[1] === undefined && !('apps' in props)) {
    			console.warn("<AppBlock> was created without expected prop 'apps'");
    		}
    	}

    	get title() {
    		throw new Error("<AppBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AppBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get apps() {
    		throw new Error("<AppBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apps(value) {
    		throw new Error("<AppBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/AppFrame.svelte generated by Svelte v3.42.4 */

    const { console: console_1 } = globals;
    const file$2 = "src/AppFrame.svelte";

    function create_fragment$2(ctx) {
    	let iframe;
    	let t;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			t = text("Loading");
    			attr_dev(iframe, "title", /*id*/ ctx[0]);
    			if (!src_url_equal(iframe.src, iframe_src_value = /*appSrc*/ ctx[1])) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			attr_dev(iframe, "class", "svelte-1tc7xux");
    			add_location(iframe, file$2, 29, 0, 686);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    			append_dev(iframe, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(iframe, "title", /*id*/ ctx[0]);
    			}

    			if (dirty & /*appSrc*/ 2 && !src_url_equal(iframe.src, iframe_src_value = /*appSrc*/ ctx[1])) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppFrame', slots, []);
    	let { id } = $$props;
    	let appSrc = "";
    	let loaded = false;

    	onMount(() => {
    		// check that url to app demo exists
    		const appUrl = "/apps/" + id + "/index.html";

    		const request = new XMLHttpRequest();
    		request.open("GET", appUrl, true);

    		request.onreadystatechange = function () {
    			if (request.readyState === 4) {
    				console.log(request);

    				if (request.status === 404) {
    					$$invalidate(1, appSrc = "");
    					loaded = false;
    				} else {
    					$$invalidate(1, appSrc = appUrl);
    					loaded = true;
    				}
    			}
    		};

    		request.send();
    	});

    	const writable_props = ['id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<AppFrame> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({ onMount, id, appSrc, loaded });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('appSrc' in $$props) $$invalidate(1, appSrc = $$props.appSrc);
    		if ('loaded' in $$props) loaded = $$props.loaded;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, appSrc];
    }

    class AppFrame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppFrame",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console_1.warn("<AppFrame> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<AppFrame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppFrame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppDemo.svelte generated by Svelte v3.42.4 */
    const file$1 = "src/AppDemo.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let article;
    	let header;
    	let h2;
    	let t0;
    	let section;
    	let div0;
    	let appframe;
    	let t1;
    	let footer;
    	let article_transition;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	appframe = new AppFrame({
    			props: { id: /*id*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			article = element("article");
    			header = element("header");
    			h2 = element("h2");
    			t0 = space();
    			section = element("section");
    			div0 = element("div");
    			create_component(appframe.$$.fragment);
    			t1 = space();
    			footer = element("footer");
    			attr_dev(h2, "class", "svelte-14ht2hm");
    			add_location(h2, file$1, 14, 9, 467);
    			attr_dev(header, "class", "modal-header svelte-14ht2hm");
    			add_location(header, file$1, 13, 6, 428);
    			attr_dev(div0, "class", "content-container svelte-14ht2hm");
    			add_location(div0, file$1, 17, 9, 553);
    			attr_dev(section, "class", "modal-content svelte-14ht2hm");
    			add_location(section, file$1, 16, 6, 512);
    			attr_dev(footer, "class", "modal-footer svelte-14ht2hm");
    			add_location(footer, file$1, 21, 6, 654);
    			attr_dev(article, "class", "modal svelte-14ht2hm");
    			add_location(article, file$1, 12, 3, 335);
    			attr_dev(div1, "class", "backstage svelte-14ht2hm");
    			add_location(div1, file$1, 11, 0, 257);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, article);
    			append_dev(article, header);
    			append_dev(header, h2);
    			h2.innerHTML = /*title*/ ctx[2];
    			append_dev(article, t0);
    			append_dev(article, section);
    			append_dev(section, div0);
    			mount_component(appframe, div0, null);
    			append_dev(article, t1);
    			append_dev(article, footer);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(article, "click", null, false, false, false),
    					listen_dev(div1, "click", /*click_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const appframe_changes = {};
    			if (dirty & /*id*/ 1) appframe_changes.id = /*id*/ ctx[0];
    			appframe.$set(appframe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appframe.$$.fragment, local);

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, fly, { x: -500, duration: 600 }, true);
    				article_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appframe.$$.fragment, local);
    			if (!article_transition) article_transition = create_bidirectional_transition(article, fly, { x: -500, duration: 600 }, false);
    			article_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(appframe);
    			if (detaching && article_transition) article_transition.end();
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppDemo', slots, []);
    	const dispatch = createEventDispatcher();
    	let { id } = $$props;
    	let title = id;
    	const writable_props = ['id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppDemo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("close");

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		scale,
    		fly,
    		AppFrame,
    		dispatch,
    		id,
    		title
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, dispatch, title, click_handler];
    }

    class AppDemo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppDemo",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppDemo> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<AppDemo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppDemo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const appBlocks = [{"title": "Descriptive statistics and plots", "apps": [{"id": "asta-b101", "title": "Quantiles, quartiles, percentiles", "info": "How to compute simple statistics for a sample."}, {"id": "asta-b102", "title": "Samples and populations", "info": "How a sample taken from a population looks like."}, {"id": "asta-b103", "title": "PDF, CDF and ICDF", "info": "Main functions for theoretical distributions."}, {"id": "asta-b104", "title": "Quantile-quantile plot", "info": "How to create and interpret a QQ-plot."}]}, {"title": "Confidence intervals", "apps": [{"id": "asta-b201", "title": "Population based CI for proportion", "info": "Confidence interval for proportion, based on population parameter."}, {"id": "asta-b202", "title": "Sample based CI for proportion", "info": "Confidence interval for proportion, based on sample statistic."}, {"id": "asta-b203", "title": "Population based CI for mean", "info": "Confidence interval for mean, based on population parameter."}, {"id": "asta-b204", "title": "Sample based CI for mean", "info": "Confidence interval for mean, based on sample statistics."}]}, {"title": "Hypothesis testing", "apps": [{"id": "asta-b205", "title": "What p-value is?", "info": "Explanation of p-value using coin experiment."}, {"id": "asta-b206", "title": "Test for sample proportion", "info": "How test for proportion works."}, {"id": "asta-b207", "title": "One sample t-test", "info": "Test for mean of one sample."}, {"id": "asta-b208", "title": "Power of test and Type II error", "info": "How often you will be able to reject wrong H0."}]}, {"title": "Comparing means", "apps": [{"id": "asta-b209", "title": "Two sample t-test", "info": "How to compare mean of two samples.", "video": "https://www.youtube.com/watch?v=aircAruvnKk"}, {"id": "asta-b210", "title": "Multiple comparison and Bonferroni correction", "info": "What if we apply t-test to more than 2 groups."}, {"id": "asta-b211", "title": "One-way ANOVA (simplified)", "info": "How Analysis of Variance works for one factor."}, {"id": "asta-b212", "title": "One-way ANOVA (full)", "info": "A more detailed app."}]}];

    /* src/App.svelte generated by Svelte v3.42.4 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (39:0) {#if demoOn && appID}
    function create_if_block(ctx) {
    	let appdemo;
    	let current;

    	appdemo = new AppDemo({
    			props: { id: /*appID*/ ctx[3] },
    			$$inline: true
    		});

    	appdemo.$on("close", /*closeDemo*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(appdemo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appdemo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appdemo_changes = {};
    			if (dirty & /*appID*/ 8) appdemo_changes.id = /*appID*/ ctx[3];
    			appdemo.$set(appdemo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appdemo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appdemo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appdemo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(39:0) {#if demoOn && appID}",
    		ctx
    	});

    	return block;
    }

    // (49:0) {#each appBlocksShow.filter(v => v.apps.length > 0) as appBlock}
    function create_each_block(ctx) {
    	let appblock;
    	let current;
    	const appblock_spread_levels = [/*appBlock*/ ctx[11]];
    	let appblock_props = {};

    	for (let i = 0; i < appblock_spread_levels.length; i += 1) {
    		appblock_props = assign(appblock_props, appblock_spread_levels[i]);
    	}

    	appblock = new AppBlock({ props: appblock_props, $$inline: true });
    	appblock.$on("showdemo", /*showDemo*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(appblock.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appblock, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appblock_changes = (dirty & /*appBlocksShow*/ 2)
    			? get_spread_update(appblock_spread_levels, [get_spread_object(/*appBlock*/ ctx[11])])
    			: {};

    			appblock.$set(appblock_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appblock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appblock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appblock, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(49:0) {#each appBlocksShow.filter(v => v.apps.length > 0) as appBlock}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let div;
    	let input;
    	let t1;
    	let button;
    	let t3;
    	let span;
    	let t4;
    	let t5;
    	let each_1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*demoOn*/ ctx[2] && /*appID*/ ctx[3] && create_if_block(ctx);
    	let each_value = /*appBlocksShow*/ ctx[1].filter(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "×";
    			t3 = space();
    			span = element("span");
    			t4 = text(/*appListInfo*/ ctx[4]);
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(input, "placeholder", "Enter a single keyword (e.g. interval)");
    			attr_dev(input, "class", "svelte-12lrilt");
    			add_location(input, file, 43, 3, 1249);
    			attr_dev(button, "class", "svelte-12lrilt");
    			toggle_class(button, "hidden", /*searchStr*/ ctx[0].length < 1);
    			add_location(button, file, 44, 3, 1363);
    			attr_dev(span, "class", "svelte-12lrilt");
    			add_location(span, file, 45, 3, 1467);
    			attr_dev(div, "class", "search-block svelte-12lrilt");
    			add_location(div, file, 42, 0, 1219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*searchStr*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(div, t3);
    			append_dev(div, span);
    			append_dev(span, t4);
    			insert_dev(target, t5, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", /*resetSearch*/ ctx[7], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(button, "click", /*click_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*demoOn*/ ctx[2] && /*appID*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*demoOn, appID*/ 12) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*searchStr*/ 1 && input.value !== /*searchStr*/ ctx[0]) {
    				set_input_value(input, /*searchStr*/ ctx[0]);
    			}

    			if (dirty & /*searchStr*/ 1) {
    				toggle_class(button, "hidden", /*searchStr*/ ctx[0].length < 1);
    			}

    			if (!current || dirty & /*appListInfo*/ 16) set_data_dev(t4, /*appListInfo*/ ctx[4]);

    			if (dirty & /*appBlocksShow, showDemo*/ 34) {
    				each_value = /*appBlocksShow*/ ctx[1].filter(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = v => v.apps.length > 0;

    function instance($$self, $$props, $$invalidate) {
    	let appBlocksShow;
    	let numApps;
    	let appListInfo;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let demoOn = false;
    	let appID = undefined;
    	let searchStr = "";

    	function showDemo(e) {
    		$$invalidate(3, appID = e.detail);
    		$$invalidate(2, demoOn = true);
    		document.querySelector("body").style.overflow = "hidden";
    	}

    	

    	function closeDemo(e) {
    		document.querySelector("body").style.overflow = "auto";
    		$$invalidate(2, demoOn = false);
    		$$invalidate(3, appID = undefined);
    	}

    	

    	function resetSearch(e = undefined) {
    		if (e === undefined || e.key === 'Escape') $$invalidate(0, searchStr = "");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchStr = this.value;
    		$$invalidate(0, searchStr);
    	}

    	const click_handler = () => resetSearch(undefined);

    	$$self.$capture_state = () => ({
    		AppBlock,
    		AppDemo,
    		appBlocks,
    		demoOn,
    		appID,
    		searchStr,
    		showDemo,
    		closeDemo,
    		resetSearch,
    		numApps,
    		appListInfo,
    		appBlocksShow
    	});

    	$$self.$inject_state = $$props => {
    		if ('demoOn' in $$props) $$invalidate(2, demoOn = $$props.demoOn);
    		if ('appID' in $$props) $$invalidate(3, appID = $$props.appID);
    		if ('searchStr' in $$props) $$invalidate(0, searchStr = $$props.searchStr);
    		if ('numApps' in $$props) $$invalidate(8, numApps = $$props.numApps);
    		if ('appListInfo' in $$props) $$invalidate(4, appListInfo = $$props.appListInfo);
    		if ('appBlocksShow' in $$props) $$invalidate(1, appBlocksShow = $$props.appBlocksShow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchStr*/ 1) {
    			$$invalidate(1, appBlocksShow = searchStr.length > 1
    			? appBlocks.map(v => ({
    					title: v.title,
    					apps: v.apps.filter(a => a.title.toLowerCase().search(searchStr.toLowerCase()) >= 0 | a.info.toLowerCase().search(searchStr.toLowerCase()) >= 0)
    				}))
    			: appBlocks);
    		}

    		if ($$self.$$.dirty & /*appBlocksShow*/ 2) {
    			$$invalidate(8, numApps = appBlocksShow.reduce((v, c) => parseInt(v) + c.apps.length, 0));
    		}

    		if ($$self.$$.dirty & /*searchStr, numApps*/ 257) {
    			$$invalidate(4, appListInfo = searchStr.length > 0
    			? `Found ${numApps} app${numApps > 1 ? "s" : ""}`
    			: `${numApps} apps in the list.`);
    		}
    	};

    	return [
    		searchStr,
    		appBlocksShow,
    		demoOn,
    		appID,
    		appListInfo,
    		showDemo,
    		closeDemo,
    		resetSearch,
    		numApps,
    		input_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({target: document.getElementById("app-list"),});

    return app;

}());
//# sourceMappingURL=bundle.js.map
