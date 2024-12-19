import { gsap } from 'gsap'

// ----------------------------------------------------------------------------- TYPES
type IPoint = {
	x:number
	y:number
}

type IAnimateOptions = {
	duration	?:number
	delay			?:number
	ease			?:string
}

type IInitOptions = {
	moveDamping				?:number
	mouseStyle				?:Partial<CSSStyleDeclaration>
	hideScrollbar			?:boolean
	hideCursor				?:boolean
	defaultAnimate		?:IAnimateOptions
	verbose						?:boolean
	preventMouseWheel	?:boolean
}

// ----------------------------------------------------------------------------- LOAD SCRIPT HELPER
async function loadScriptAsync( url:string ) {
  return new Promise(( resolve, reject ) => {
    const script = document.createElement( 'script' );
    script.type = 'text/javascript';
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild( script );
  });
}

// ----------------------------------------------------------------------------- CSS OVERRIDES
const hideScrollbarCSS = `
	body::-webkit-scrollbar,
	html::-webkit-scrollbar {
		display: none;
	}
	body, html {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
`
const hideCursorCSS = `
	body, html, html > body {
		cursor: none !important;
	}
`

export function createVirtualMouse ( options:IInitOptions = {} ) {

	// --------------------------------------------------------------------------- INIT
	// Default options
	const moveDamping = options.moveDamping ?? 0
	const verbose = options.verbose ?? false
	// Default animation
	const defaultAnimateOptions:IAnimateOptions = {
		...options?.defaultAnimate,
		duration: 1,
		delay: 0,
		ease: 'power4.inOut',
	}

	// Style override to hide scrollbar and hide cursor
	let overrideStyle
	const stylesToApply = []
	if ( options.hideScrollbar )
		stylesToApply.push( hideScrollbarCSS )
	if ( options.hideCursor )
		stylesToApply.push( hideCursorCSS )
	if ( stylesToApply.length > 0 ) {
		overrideStyle = document.createElement('style')
		overrideStyle.appendChild(document.createTextNode(stylesToApply.join("\n")))
		document.head.appendChild(overrideStyle)
	}

	// Prevent mouse wheel
	function mouseWheelHandler (event:Event) {
		event.preventDefault()
		event.stopPropagation()
		event.stopImmediatePropagation()
	}
	if ( options.preventMouseWheel ) {
		window.addEventListener("wheel", mouseWheelHandler, {
			capture: true,
			passive: false,
		})
	}

	// Create mouse style
	const mouseStyle:Partial<CSSStyleDeclaration> = {
		// Default mouse style
		position: 'fixed',
		top: `0px`,
		left: `0px`,
		width: `20px`,
		height: `20px`,
		borderRadius: '50%',
		border: '1px solid grey',
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		transform: "translate(-50%, -50%)",
		pointerEvents: 'none',
		zIndex: '9999999',
		// Mouse style override
		...options.mouseStyle,
	}

	// Create virtual mouse element
	let mouseElement = document.createElement('div')
	document.body.appendChild( mouseElement )
	Object.keys( mouseStyle ).map(property => {
		mouseElement.style[property] = mouseStyle[ property ]
	})

	// Mouse position, screen relative
	const position:IPoint = { x:0, y:0 }

	// To detect hover changes
	let previousElement

	// --------------------------------------------------------------------------- HACK HOVERS
	let styler
	async function initStyler () {
		await loadScriptAsync("https://cdn.jsdelivr.net/gh/TSedlar/pseudo-styler@1.0.8/pseudostyler.js")
		// @ts-ignore
		styler = new PseudoStyler()
		await styler.loadDocumentStyles()
	}

	// --------------------------------------------------------------------------- PRIVATES
	function getHoveredElement () {
		const { x, y } = position
		return document.elementFromPoint( x, y )
	}
	function createMouseEvent ( type:string ) {
		const { x, y } = position
		return new MouseEvent( type, {
			clientX: x,
			clientY: y,
			view: window,
			bubbles: true,
			cancelable: true,
		})
	}
	function updatePosition () {
		gsap.to(mouseElement, {
			duration: moveDamping,
			x: position.x,
			y: position.y,
		})
		const element = getHoveredElement()
		if ( element !== previousElement ) {
			// Dispatch hover and change style
			element && styler && styler.toggleStyle(element, ':hover', true);
			element?.dispatchEvent( createMouseEvent('mouseover') )
			// Dispatch mouse leave and revert style
			previousElement && styler && styler.toggleStyle(previousElement, ':hover', false);
			previousElement?.dispatchEvent( createMouseEvent('mouseleave') )
		}
		previousElement = element
		if ( !element )
			return
		element.dispatchEvent( createMouseEvent('mousemove') )
	}
	function getScrollableParent (node:Element) {
    while (node && node !== document.body) {
			const overflowX = window.getComputedStyle(node).overflowX;
			const overflowY = window.getComputedStyle(node).overflowY;
			if (
				overflowX === 'auto' || overflowY === 'auto'
				|| overflowX === 'scroll' || overflowY === 'scroll'
			)
				return node;
			node = node.parentElement;
    }
    return document.scrollingElement ?? document.documentElement;
	}

	const log = (method:string, object:any, element?:any) => {
		if ( verbose ) {
			console.info(`${method} - ${JSON.stringify(object)}`)
			element && console.log( element )
		}
	}

	// --------------------------------------------------------------------------- PUBLIC API
	return {
		// Get mouse element to tweak it externally
		get mouseElement () { return mouseElement },

		async initHoversHack () {
			await initStyler()
		},

		// Go to a screen absolute position
		async to ( x:number, y:number, options?:IAnimateOptions ) {
			log("to", {x, y, ...options})
			return gsap.to(position, {
				...defaultAnimateOptions, ...options,
				x, y,
				onUpdate: updatePosition
			})
		},

		// Move to a screen relative position
		async move ( x:number, y:number, options?:IAnimateOptions ) {
			log("move", {x, y, ...options})
			return gsap.to(position, {
				...defaultAnimateOptions, ...options,
				x: `+=${x}`,
				y: `+=${y}`,
				onUpdate: updatePosition
			})
		},

		// Wait in seconds
		async delay ( duration:number ) {
			log("delay", {duration})
			return gsap.to({}, { duration })
		},

		// Hide virtual mouse
		async hide ( options?:IAnimateOptions ) {
			log("hide", options)
			return gsap.to(mouseElement, {
				...defaultAnimateOptions, ...options,
				opacity: 0,
			})
		},

		// Show virtual mouse
		async show ( options?:IAnimateOptions ) {
			log("show", options)
			return gsap.to(mouseElement, {
				...defaultAnimateOptions, ...options,
				opacity: 1,
			})
		},

		// Click
		async click ( options?:IAnimateOptions ) {
			const element = getHoveredElement()
			log("click", options, element)
			const localOptions = { ...defaultAnimateOptions, ...options }
			await gsap.to(mouseElement, {
				ease: 'power4.out',
				duration: .3 * localOptions.duration,
				scale: .8,
			})
			element?.dispatchEvent( createMouseEvent("click") )
			await gsap.to(mouseElement, {
				ease: 'power2.inOut',
				duration: .4 * localOptions.duration,
				scale: 1,
			})
		},

		// Scroll absolute on the nearest scrollable element
		async scrollTo ( x:number, y:number, options?:IAnimateOptions ) {
			const element = getHoveredElement()
			const scrollableElement = getScrollableParent( element )
			log("scrollTo", {x, y, ...options}, scrollableElement)
			if ( !scrollableElement )
				return
			return gsap.to(scrollableElement, {
				...defaultAnimateOptions, ...options,
				scrollLeft: x,
				scrollTop: y,
			})
		},

		// Scroll relative on the nearest scrollable element
		async scroll ( x:number, y:number, options?:IAnimateOptions ) {
			const element = getHoveredElement()
			const scrollableElement = getScrollableParent( element )
			log("scroll", {x, y, ...options}, scrollableElement)
			if ( !scrollableElement )
				return
			return gsap.to(scrollableElement, {
				...defaultAnimateOptions, ...options,
				scrollLeft: `+=${x}`,
				scrollTop: `+=${y}`,
			})
		},

		// Destroy virtual mouse
		dispose () {
			overrideStyle && overrideStyle.remove()
			mouseElement.remove()
			mouseElement = null
			window.removeEventListener("wheel", mouseWheelHandler, {
				capture: true
			})
			styler = null
			previousElement = null
		}
	}
}
