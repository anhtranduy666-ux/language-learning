/**
 * Khu vườn ban ngày.
 *
 * Đồi cỏ và cây hoa đào vẽ bằng SVG, hoa cỏ bằng gradient lặp, ong bướm là
 * năm phần tử nhỏ bay qua bay lại. Vị trí, tốc độ và luật hiện/ẩn theo tiến độ
 * nằm hết trong `src/styles/scene.css` — ở đây chỉ có hình.
 */
export function GardenScene() {
  return (
    <>
      <div className="scene-sky" />
      <div className="scene-sun" />
      <div className="scene-cloud scene-cloud--1" />
      <div className="scene-cloud scene-cloud--2" />

      <svg className="scene-hills" viewBox="0 0 390 340" preserveAspectRatio="none">
        <path d="M0 126C70 98 140 120 210 96 280 72 332 102 390 84V340H0Z" fill="#b9d8e2" />
        <path d="M0 158C62 126 112 146 172 122 232 98 302 134 390 108V340H0Z" fill="#9ccfae" opacity=".95" />
        <path d="M0 204C72 176 122 194 192 174 262 154 330 184 390 166V340H0Z" fill="#7cc183" />
        <path d="M0 258C80 234 152 252 232 238 302 226 352 244 390 234V340H0Z" fill="#5dad61" />
      </svg>

      <div className="scene-flowers" />

      <div className="scene-band">
        {/* Thân cây cố ý ngắn: trên điện thoại, cột nội dung chiếm gần hết bề
            ngang, nên khoảng trống duy nhất để khoe hoa là dải cỏ sát đáy màn
            hình. Cây mọc từ mép dưới lên, tán nằm gọn trong dải đó. */}
        <svg className="scene-tree scene-tree--main" viewBox="0 0 250 360">
          <path
            d="M126 360V196M126 232c-20-12-31-30-36-52M126 206c18-11 29-27 34-47"
            fill="none"
            stroke="#7a5442"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <g className="scene-canopy" opacity=".95">
            <circle cx="114" cy="150" r="58" fill="#f6a7c4" />
            <circle cx="60" cy="172" r="44" fill="#f9bcd2" />
            <circle cx="168" cy="170" r="42" fill="#f9bcd2" />
            <circle cx="130" cy="92" r="42" fill="#fbc9db" />
            <circle cx="74" cy="112" r="32" fill="#f6a7c4" />
            <circle cx="176" cy="116" r="28" fill="#fdd7e4" />
            <circle cx="104" cy="200" r="28" fill="#f08fb4" />
            <circle cx="156" cy="208" r="22" fill="#fbc9db" />
          </g>
        </svg>

        {/* Cây thứ hai là phần thưởng cho streak — CSS giữ nó ẩn cho tới lúc đó. */}
        <svg className="scene-tree scene-tree--second" viewBox="0 0 140 230">
          <path
            d="M70 230V118M70 146c-13-8-20-19-24-33"
            fill="none"
            stroke="#7a5442"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g className="scene-canopy" opacity=".9">
            <circle cx="66" cy="92" r="36" fill="#f6a7c4" />
            <circle cx="30" cy="110" r="24" fill="#fbc9db" />
            <circle cx="102" cy="108" r="22" fill="#fbc9db" />
            <circle cx="74" cy="54" r="24" fill="#fdd7e4" />
          </g>
        </svg>

        <div className="scene-petal scene-petal--1" />
        <div className="scene-petal scene-petal--2" />
        <div className="scene-petal scene-petal--3" />
        <div className="scene-petal scene-petal--4" />

        <Flyer path="a" bob="a">
          <Butterfly size={24} wing="#ff9ec4" wingLight="#ffc7de" body="#5a3b52" />
        </Flyer>
        <Flyer path="b" bob="b">
          <Butterfly size={20} wing="#ffd591" wingLight="#ffe9c2" body="#6b4a2a" />
        </Flyer>
        <Flyer path="c" bob="c">
          <Butterfly size={17} wing="#c9b6f5" wingLight="#e6dbff" body="#4b3b6b" />
        </Flyer>
        <Flyer path="d" bob="d" facing>
          <Bee size={20} />
        </Flyer>
        <Flyer path="e" bob="e" facing>
          <Bee size={16} />
        </Flyer>
      </div>
    </>
  )
}

/**
 * Một con vật đang bay.
 *
 * Ba lớp lồng nhau, mỗi lớp một chuyển động, để đường bay cong mà chỉ tốn ba
 * animation đơn giản: sweep ngang → nhịp lên xuống → quay mặt.
 * `facing` chỉ dành cho con có đầu: bướm đối xứng nên lật cũng như không.
 */
function Flyer({
  path,
  bob,
  facing = false,
  children,
}: {
  path: 'a' | 'b' | 'c' | 'd' | 'e'
  bob: 'a' | 'b' | 'c' | 'd' | 'e'
  facing?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`scene-fly scene-fly--${path}`}>
      <div className={`scene-bob scene-bob--${bob}`}>
        {facing ? <div className="scene-face">{children}</div> : children}
      </div>
    </div>
  )
}

function Butterfly({
  size,
  wing,
  wingLight,
  body,
}: {
  size: number
  wing: string
  wingLight: string
  body: string
}) {
  return (
    <svg viewBox="0 0 24 18" width={size} height={(size * 18) / 24}>
      <g className="scene-wing">
        <path d="M12 9C9 1 2 1 2 7c0 5 7 6 10 2Z" fill={wing} />
        <path d="M12 9c3-8 10-8 10-2 0 5-7 6-10 2Z" fill={wingLight} />
      </g>
      <path d="M12 4.5v9" stroke={body} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Bee({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 26 18" width={size} height={(size * 18) / 26}>
      <ellipse cx="15" cy="10.5" rx="6.4" ry="4.6" fill="#f5b83d" />
      <path d="M13 6.4v8.2M16.6 6.8v7.4" stroke="#3b2a12" strokeWidth="1.7" />
      <circle cx="7.4" cy="9.8" r="2.8" fill="#3b2a12" />
      <g className="scene-wing">
        <ellipse cx="14" cy="5" rx="4.6" ry="2.4" fill="rgba(255,255,255,.85)" />
      </g>
    </svg>
  )
}
