// if want refresh page then use this component, but currently not in use

// "use client";

// import { motion } from "framer-motion";

// export default function RefreshScreen() {
//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#05070f]">

//       {/* Animated Background */}
//       <div className="absolute inset-0">
//         <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
//         <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
//       </div>

//       {/* Floating Particles */}
//       {[...Array(20)].map((_, i) => (
//         <motion.div
//           key={i}
//           className="absolute h-2 w-2 rounded-full bg-cyan-400"
//           initial={{
//             x: Math.random() * 1000 - 500,
//             y: 400,
//             opacity: 0,
//           }}
//           animate={{
//             y: -400,
//             opacity: [0, 1, 0],
//           }}
//           transition={{
//             duration: 5 + Math.random() * 3,
//             repeat: Infinity,
//             delay: Math.random() * 5,
//           }}
//         />
//       ))}

//       <div className="relative flex flex-col items-center">

//         {/* Rotating Ring */}
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{
//             repeat: Infinity,
//             duration: 3,
//             ease: "linear",
//           }}
//           className="absolute h-40 w-40 rounded-full border-4 border-cyan-500 border-t-transparent"
//         />

//         {/* Center Logo */}
//         <motion.div
//           initial={{ scale: 0 }}
//           animate={{
//             scale: [1, 1.08, 1],
//           }}
//           transition={{
//             duration: 2,
//             repeat: Infinity,
//           }}
//           className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-2xl"
//         >
//           <span className="text-4xl">🤖</span>
//         </motion.div>

//         {/* Title */}
//         <motion.h1
//           className="mt-10 text-3xl font-bold text-white"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: [0.4, 1, 0.4] }}
//           transition={{
//             duration: 2,
//             repeat: Infinity,
//           }}
//         >
//           Butler AI
//         </motion.h1>

//         <motion.p
//           className="mt-2 text-gray-400"
//           animate={{
//             opacity: [0.4, 1, 0.4],
//           }}
//           transition={{
//             duration: 1.5,
//             repeat: Infinity,
//           }}
//         >
//           Refreshing your smart home...
//         </motion.p>

//         {/* Progress Bar */}
//         <div className="mt-8 h-2 w-72 overflow-hidden rounded-full bg-gray-800">
//           <motion.div
//             className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
//             initial={{ x: "-100%" }}
//             animate={{ x: "100%" }}
//             transition={{
//               duration: 2,
//               repeat: Infinity,
//               ease: "linear",
//             }}
//           />
//         </div>

//       </div>
//     </div>
//   );
// }