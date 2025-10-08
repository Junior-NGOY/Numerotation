// Type declarations for CSS modules and global CSS imports
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.sass" {
  const content: { [className: string]: string };
  export default content;
}

// Global CSS imports (side-effect imports)
declare module "*.css?*" {
  const content: any;
  export default content;
}
