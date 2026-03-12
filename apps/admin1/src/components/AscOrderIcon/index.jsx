const DescSvg = (props) => (
  <svg
    t="1722308608179"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="9294"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      d="M737.78829 1010.354626H614.29766V0L1023.403015 378.232698l-83.407346 91.935704-202.207379-186.856334z"
      fill="#ccc"
      p-id="9295"
    ></path>
    <path
      d="M409.105355 1023.403015L0 645.170317l83.407346-91.85042 202.207379 186.856334V13.048388h123.49063z"
      fill="#7F56D9"
      p-id="9296"
    ></path>
  </svg>
)

const AscSvg = (props) => (
  <svg
    t="1722308774209"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="9621"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      d="M737.78829 1010.354626H614.29766V0L1023.403015 378.232698l-83.407346 91.935704-202.207379-186.856334z"
      fill="#7F56D9"
      p-id="9622"
    ></path>
    <path
      d="M409.105355 1023.403015L0 645.170317l83.407346-91.85042 202.207379 186.856334V13.048388h123.49063z"
      fill="#ccc"
      p-id="9623"
    ></path>
  </svg>
)

/* 是否升序 */
export const AscOrder = ({ isAsc, ...rest }) => {
  const Comp = isAsc ? AscSvg : DescSvg
  return <Comp {...rest} />
}
