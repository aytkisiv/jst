# Component Patterns — just to study

## Background (all light screens)
```css
background: white;
/* purple blob top-left */
radial-gradient at 0% 0%: rgba(124,92,191,0.15) 0%, transparent 60%
/* pink blob bottom-right */
radial-gradient at 100% 100%: rgba(249,168,212,0.15) 0%, transparent 60%
/* vertical grid lines */
repeating-linear-gradient: rgba(124,92,191,0.06) every 40px
```

## Glassmorphism Card
```css
background: rgba(255,255,255,0.65);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.8);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(124,92,191,0.12);
```

## Primary Button
```css
background: linear-gradient(135deg, #7c5cbf, #e879a0);
border-radius: 9999px;
padding: 14px 32px;
font-weight: 600;
box-shadow: 0 4px 20px rgba(124,92,191,0.35);
color: white;
```

## Floating Navbar (glassmorphism pill)
```css
background: rgba(255,255,255,0.8);
backdrop-filter: blur(20px);
border-radius: 9999px;
border: 1px solid rgba(255,255,255,0.9);
box-shadow: 0 4px 24px rgba(124,92,191,0.15);
padding: 8px 20px;
```

## Message Bubble — Tutor (left)
```css
background: rgba(255,255,255,0.65);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.8);
border-radius: 4px 16px 16px 16px;
padding: 12px 16px;
```

## Message Bubble — User (right)
```css
background: linear-gradient(135deg, #7c5cbf, #e879a0);
border-radius: 16px 4px 16px 16px;
padding: 12px 16px;
color: white;
```

## Grammar Correction Card
```css
/* inside tutor bubble */
background: rgba(16,185,129,0.08);
border: 1px solid rgba(16,185,129,0.2);
border-radius: 8px;
padding: 10px 12px;
/* wrong text: */
text-decoration: line-through;
color: #ef4444;
/* correct text: */
color: #10b981;
font-weight: 500;
```

## XP Bar
```css
background: rgba(124,92,191,0.1);
border-radius: 9999px;
height: 8px;
/* fill: */
background: linear-gradient(90deg, #7c5cbf, #a67fe8);
/* animated on gain */
transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
```

## Voice Overlay
```css
background: rgba(15,10,26,0.92);
backdrop-filter: blur(40px);
/* pulsing rings on mic button */
animation: pulse 2s ease-in-out infinite;
/* ring colors: */
ring-1: rgba(124,92,191,0.4)
ring-2: rgba(124,92,191,0.2)
ring-3: rgba(124,92,191,0.1)
```

## Framer Motion Defaults
```js
// Page transition
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }

// Card hover
whileHover: { y: -4, scale: 1.02 }
transition: { type: "spring", stiffness: 400 }

// XP popup
initial: { opacity: 0, scale: 0.5, y: 0 }
animate: { opacity: [0,1,1,0], scale: [0.5,1.1,1,1], y: [0,-20,-30,-50] }
transition: { duration: 1.5 }
```
