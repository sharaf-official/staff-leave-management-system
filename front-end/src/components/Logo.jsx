export default function Logo({ size = 22 }) {
  return (
    <img
      src="/Logo.png"
      alt="Leave Nest"
      width={size}
      height={size}
      className="logo-img"
      draggable="false"
    />
  );
}