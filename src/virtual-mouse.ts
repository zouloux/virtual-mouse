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

// -----------------------------------------------------------------------------
async function loadScriptAsync( url:string ) {
  return new Promise(( resolve, reject ) => {
    const script = document.createElement('script');
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

// ----------------------------------------------------------------------------- REACT EVENT NAMES
const reactEventsMap = {
	'mouseenter' 	: 'onMouseEnter',
	'mouseleave' 	: 'onMouseLeave',
	'mousedown' 	: 'onMouseDown',
	'mouseup' 		: 'onMouseUp',
	'mousemove' 	: 'onMouseMove',
	'change' 			: 'onChange',
	'keydown' 		: 'onKeyDown',
	'keyup' 			: 'onKeyUp',
}

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
	const dampedPosition:IPoint = { x:0, y:0 }

	// To detect hover changes
	let previousElement

	// Global speed
	let speed = 1

	// Styler object to hack hovers
	let styler

	let reactPropsKey

	// --------------------------------------------------------------------------- PRIVATES
	function log (method:string, object:any, element?:any) {
		if ( verbose ) {
			console.info(`${method} - ${JSON.stringify(object)}`)
			element && console.log( element )
		}
	}
	function reactSyntheticEvent (element:Element, event:Event) {
		if ( !reactPropsKey )
			return
		const property = reactEventsMap[ event.type ]
		if ( !property )
			return
		element[property]?.({
			type: event.type,
			target: event.target,
			currentTarget: event.currentTarget,
			bubbles: event.bubbles,
			cancelable: event.cancelable,
			defaultPrevented: event.defaultPrevented,
			eventPhase: event.eventPhase,
			isTrusted: event.isTrusted,
			nativeEvent: event,
			preventDefault() {
				event.preventDefault()
			},
			isDefaultPrevented() {
				return false
			},
			stopPropagation() {
				event.stopPropagation()
			},
			persist() {},
		})
	}
	function getHoveredElement () {
		const { x, y } = dampedPosition
		return document.elementFromPoint( x, y )
	}
	function createMouseEvent ( type:string, bubbles:boolean = true ) {
		const { x, y } = dampedPosition
		return new MouseEvent( type, {
			clientX: x,
			clientY: y,
			view: window,
			bubbles,
			cancelable: true,
		})
	}
	function getParentElementsSet( element:Element ) {
		const parents = new Set();
		while ( element ) {
			parents.add( element );
			element = element.parentElement;
		}
		return parents;
	}
	function differenceBetweenSets( setA, setB ) {
		const difference = new Set();
		setA.forEach( item => {
			if ( !setB.has( item ) ) {
				difference.add( item );
			}
		});
		return difference;
	}
	function updateHoverState () {
		const element = getHoveredElement()

		if ( element ) {
			const event = createMouseEvent('mousemove', true)
			reactSyntheticEvent(element, event)
			element.dispatchEvent( event )
		}

		if ( element !== previousElement ) {
			log("updateHoverState", {}, element)
			const parentSet = getParentElementsSet( element )
			const previousParentSet = getParentElementsSet( previousElement )
			const areNewHovers = differenceBetweenSets(parentSet, previousParentSet)
			areNewHovers.forEach( (element:Element) => {
				styler && styler.toggleStyle(element, ':hover', true);
				const event = createMouseEvent('mouseenter', false)
				// reactSyntheticEvent(element, event)
				element.dispatchEvent( event )
			})
			const areOldHovers = differenceBetweenSets(previousParentSet, parentSet)
			areOldHovers.forEach( (element:Element) => {
				styler && styler.toggleStyle(element, ':hover', false);
				const event = createMouseEvent('mouseleave', false)
				// reactSyntheticEvent(element, event)
				element.dispatchEvent( event )
			})
		}
		previousElement = element
	}
	function updatePosition () {
		gsap.to(dampedPosition, {
			duration: moveDamping * (1 / speed),
			x: position.x,
			y: position.y,
			overwrite: true,
			onUpdate: () => {
				gsap.set(mouseElement, {
					x: dampedPosition.x,
					y: dampedPosition.y,
				})
				updateHoverState()
			}
		})
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

	// --------------------------------------------------------------------------- PUBLIC API
	return {
		// Get mouse element to tweak it externally
		get mouseElement () { return mouseElement },

		async initHoversHack () {
			// @ts-ignore
			if (!('PseudoStyler' in window))
				await loadScriptAsync("https://cdn.jsdelivr.net/gh/TSedlar/pseudo-styler@1.0.8/pseudostyler.js")
			// @ts-ignore
			styler = new PseudoStyler()
			await styler.loadDocumentStyles()
		},

		initReactEvents ( element:Element ) {
			const key = Object.keys(element).find( k => k.startsWith("__reactProps") )
			if ( typeof element[key] !== "object" )
				return
			reactPropsKey = key
			log("initReactEvents", {reactPropsKey}, element)
		},

		// Go to a screen absolute position
		async to ( x:number, y:number, options?:IAnimateOptions ) {
			log("to", {x, y, ...options})
			const o = { ...defaultAnimateOptions, ...options }
			return gsap.to(position, {
				...o, x, y,
				duration: o.duration * (1 / speed),
				onUpdate: updatePosition
			})
		},

		// Move to a screen relative position
		async move ( x:number, y:number, options?:IAnimateOptions ) {
			log("move", {x, y, ...options})
			const o = { ...defaultAnimateOptions, ...options }
			return gsap.to(position, {
				...o,
				duration: o.duration * (1 / speed),
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
			const o = { ...defaultAnimateOptions, ...options }
			return gsap.to(mouseElement, {
				...o,
				duration: o.duration * (1 / speed),
				opacity: 0,
				onUpdate: updatePosition
			})
		},

		// Show virtual mouse
		async show ( options?:IAnimateOptions ) {
			log("show", options)
			const o = { ...defaultAnimateOptions, ...options }
			return gsap.to(mouseElement, {
				...o,
				duration: o.duration * (1 / speed),
				opacity: 1,
			})
		},

		// Click
		async click ( options?:IAnimateOptions ) {
			const element = getHoveredElement()
			log("click", options, element)
			const o = { ...defaultAnimateOptions, ...options }
			await gsap.to(mouseElement, {
				ease: 'power4.out',
				duration: .3 * o.duration * (1 / speed),
				scale: .8,
			})
			element?.dispatchEvent( createMouseEvent("click") )
			await gsap.to(mouseElement, {
				ease: 'power2.inOut',
				duration: .4 * o.duration * (1 / speed),
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
			const o = { ...defaultAnimateOptions, ...options }
			return gsap.to(scrollableElement, {
				...o,
				duration: o.duration * (1 / speed),
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
						const o = { ...defaultAnimateOptions, ...options }
			return gsap.to(scrollableElement, {
				...o,
				duration: o.duration * (1 / speed),
				scrollLeft: `+=${x}`,
				scrollTop: `+=${y}`,
				onUpdate: updateHoverState,
			})
		},

		speed (value:number) {
			log("speed", {value})
			if ( value <= 0 || isNaN( value ) )
				return
			speed = value
		},

		// Destroy virtual mouse
		dispose () {
			log("dispose", {})
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
