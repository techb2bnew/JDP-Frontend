import svgPaths from "./svg-nyds3vwrvz";
// import imgImage from "figma:asset/78434944002354bad48d5cfc533a12ff4990eed2.png";
// import imgImage1 from "figma:asset/4c4bfca98b5ca77eb625df56ff4f01b138f7792f.png";
// import imgLogo11111 from "figma:asset/23399e3d538cdd16afc216a9532c4a03c5475895.png";

interface CaratProps {
  direction?: "back" | "forward";
}

function Carat({ direction = "back" }: CaratProps) {
  if (direction === "forward") {
    return (
      <div className="relative size-full" data-name="direction=forward">
        <div className="absolute bottom-1/4 flex items-center justify-center left-[36.833%] right-[32.292%] top-1/4">
          <div className="flex-none h-[7.41px] rotate-[90deg] scale-y-[-100%] w-3">
            <div className="relative size-full" >
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 12 8"
              >
                <path
                  d={svgPaths.p3a351d00}
                  fill="var(--fill-0, #C4CDD5)"
                  id="Vector"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative size-full" data-name="direction=back">
      <div className="absolute bottom-1/4 flex items-center justify-center left-[32.292%] right-[36.833%] top-1/4">
        <div className="flex-none h-[7.41px] rotate-[90deg] w-3">
          <div className="relative size-full" data-name="Vector">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 12 8"
            >
              <path
                d={svgPaths.p3a351d00}
                fill="var(--fill-0, #C4CDD5)"
                id="Vector"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  value?: string;
  type?: "Numeral" | "Arrow";
  state?: "Default" | "Disabled" | "Active";
}

function Page({ value = "1", type = "Arrow", state = "Disabled" }: PageProps) {
  if (type === "Numeral" && state === "Active") {
    return (
      <div
        className="relative size-full"
        data-name="Type=Numeral, State=Active"
      >
        <div
          className="absolute bg-[#ffffff] inset-0 rounded"
          data-name="page / active"
        >
          <div className="overflow-clip relative size-full">
            <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#4200ff] text-[14px] text-center top-[5px]">
              <p className="block leading-[20px]">1</p>
            </div>
          </div>
          <div className="absolute border border-[#4200ff] border-solid inset-0 pointer-events-none rounded" />
        </div>
      </div>
    );
  }
  if (type === "Numeral" && state === "Default") {
    return (
      <div
        className="bg-[#ffffff] relative rounded size-full"
        data-name="Type=Numeral, State=Default"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#212b36] text-[14px] text-center top-[5px]">
          <p className="block leading-[20px]">{value}</p>
        </div>
      </div>
    );
  }
  if (type === "Arrow" && state === "Default") {
    return (
      <div
        className="bg-[#ffffff] relative rounded size-full"
        data-name="Type=Arrow, State=Default"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute inset-[12.5%]" data-name="carat">
          <Carat direction="forward" />
        </div>
      </div>
    );
  }
  return (
    <div
      className="bg-[#919eab] opacity-50 relative rounded size-full"
      data-name="Type=Arrow, State=Disabled"
    >
      <div className="absolute inset-[12.5%]" data-name="carat">
        <Carat />
      </div>
    </div>
  );
}

function Pagination() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative size-full"
      data-name="pagination"
    >
      <div
        className="bg-[#ffffff] relative rounded shrink-0 size-8"
        data-name="page"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute inset-[12.5%]" data-name="carat">
          <div className="absolute bottom-1/4 flex items-center justify-center left-[32.292%] right-[36.833%] top-1/4">
            <div className="flex-none h-[7.41px] rotate-[90deg] w-3">
              <div className="relative size-full" data-name="Vector">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  role="presentation"
                  viewBox="0 0 12 8"
                >
                  <path
                    d={svgPaths.p3a351d00}
                    fill="var(--fill-0, #C4CDD5)"
                    id="Vector"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative shrink-0 size-8" data-name="page">
        <div
          className="absolute bg-[#ffffff] inset-0 rounded"
          data-name="page / active"
        >
          <div className="overflow-clip relative size-full">
            <div className="absolute bottom-[5px] font-['SF_Pro_Text:Bold',_sans-serif] leading-[0] left-1 not-italic right-1 text-[#0066ff] text-[14px] text-center top-[5px]">
              <p className="block leading-[20px]">1</p>
            </div>
          </div>
          <div className="absolute border border-[#0066ff] border-solid inset-0 pointer-events-none rounded" />
        </div>
      </div>
      <div
        className="bg-[#ffffff] relative rounded shrink-0 size-8"
        data-name="page"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
          <p className="block leading-[20px]">2</p>
        </div>
      </div>
      <div
        className="bg-[#ffffff] relative rounded shrink-0 size-8"
        data-name="page"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
          <p className="block leading-[20px]">...</p>
        </div>
      </div>
      <div
        className="bg-[#ffffff] relative rounded shrink-0 size-8"
        data-name="page"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
          <p className="block leading-[20px]">9</p>
        </div>
      </div>
      <div
        className="bg-[#ffffff] relative rounded shrink-0 size-8"
        data-name="page"
      >
        <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
        <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
          <p className="block leading-[20px]">10</p>
        </div>
      </div>
      <div
        className="bg-[#ffffff] relative rounded shrink-0 size-8"
        data-name="page"
      >
        <Pagination />
      </div>
    </div>
  );
}

function Group1171276412() {
  return (
    <div className="absolute contents leading-[0] left-[591px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[591px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          SR No.
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #113
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #114
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #115
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #116
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #117
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #118
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #120
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #121
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #122
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #123
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #124
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #125
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #126
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #127
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #128
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[591px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          #119
        </p>
      </div>
    </div>
  );
}

function Group1171276411() {
  return (
    <div className="absolute contents leading-[0] left-[666px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          John Carter
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Maria
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Alex
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          David
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Kevin
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Samuel
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Samuel
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Alex
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Samuel
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Kevin
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Samuel
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Alex
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Samuel
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Maria
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          John
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[666px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          David
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[666px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Name
        </p>
      </div>
    </div>
  );
}

function Group1171276410() {
  return (
    <div className="absolute contents leading-[0] left-[765px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[765px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Email
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          john@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          maria@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Alex@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          david@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          kevin@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          samuel@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          samuel@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          alex@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          samuel@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          kevin@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          samuel@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Alex@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          samuel@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          maria@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          john@gmail.com
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[765px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          david@gmail.com
        </p>
      </div>
    </div>
  );
}

function Group1171276409() {
  return (
    <div className="absolute contents leading-[0] left-[915px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[915px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Phone Number
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal left-[915px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          +1 415‑555‑0132
        </p>
      </div>
    </div>
  );
}

function Group1171276413() {
  return (
    <div className="absolute contents leading-[0] left-[1051px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[1051px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Date
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1051px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          23-4-2025
        </p>
      </div>
    </div>
  );
}

function Group1171276422() {
  return (
    <div className="absolute contents leading-[0] left-[1146px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[1146px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Billing Address
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1146px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
    </div>
  );
}

function Group1171276314() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[395px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276386() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[442px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276387() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[486px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276388() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[529px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276389() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[573px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276390() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[617px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276391() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[661px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276392() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[702px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276393() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[744px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276394() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[784px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276395() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[826px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276396() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[867px] w-[74px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276314">
          <g clipPath="url(#clip0_2051_21)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.p30005b00}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2d7ddc00}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_21">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276415() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[908px] w-[73.545px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276415">
          <g clipPath="url(#clip0_2051_68)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.pbea5200}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2e8db200}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_68">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276416() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[949px] w-[73.545px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276415">
          <g clipPath="url(#clip0_2051_68)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.pbea5200}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2e8db200}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_68">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276417() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[990px] w-[73.545px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276415">
          <g clipPath="url(#clip0_2051_68)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.pbea5200}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2e8db200}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_68">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276418() {
  return (
    <div className="absolute h-[16.946px] left-[1590px] top-[1028px] w-[73.545px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 74 17"
      >
        <g id="Group 1171276415">
          <g clipPath="url(#clip0_2051_68)" id="eye-off">
            <path
              d={svgPaths.p32544a80}
              id="Vector"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
            <path
              d={svgPaths.p2a28a6c0}
              id="Vector_2"
              stroke="var(--stroke-0, #161616)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.41215"
            />
          </g>
          <g id="Group 1000002746">
            <path
              d={svgPaths.pbea5200}
              fill="var(--fill-0, #21BA21)"
              id="Vector_3"
            />
          </g>
          <path
            d={svgPaths.p2e8db200}
            fill="var(--fill-0, #FF0000)"
            id="Vector_4"
          />
        </g>
        <defs>
          <clipPath id="clip0_2051_68">
            <rect fill="white" height="16.9458" width="16.9458" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Group1171276419() {
  return (
    <div className="absolute contents left-[1590px] top-[353px]">
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] left-[1590px] text-[#2b2b2b] text-[16px] text-left text-nowrap top-[353px]">
        <p className="block leading-[normal] whitespace-pre">Action</p>
      </div>
      <Group1171276314 />
      <Group1171276386 />
      <Group1171276387 />
      <Group1171276388 />
      <Group1171276389 />
      <Group1171276390 />
      <Group1171276391 />
      <Group1171276392 />
      <Group1171276393 />
      <Group1171276394 />
      <Group1171276395 />
      <Group1171276396 />
      <Group1171276415 />
      <Group1171276416 />
      <Group1171276417 />
      <Group1171276418 />
    </div>
  );
}

function Group1171276420() {
  return (
    <div className="absolute contents leading-[0] left-[1333px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1333px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          XXXXXXX3732
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[1333px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Bank Details
        </p>
      </div>
    </div>
  );
}

function Group1171276421() {
  return (
    <div className="absolute contents leading-[0] left-[1463px] text-[#2b2b2b] text-left text-nowrap top-[353px]">
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[441px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[485px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[529px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[573px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[617px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[702px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[743px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[784px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[825px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[866px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[907px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[948px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[989px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[1030px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[661px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal left-[1463px] opacity-80 text-[14px] top-[397px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          PH209_US_JDP
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium left-[1463px] text-[16px] top-[353px]">
        <p className="block leading-[normal] text-nowrap whitespace-pre">
          Job Assigned
        </p>
      </div>
    </div>
  );
}

function Group1171276423() {
  return (
    <div className="absolute contents left-[568px] top-[291px]">
      <div className="absolute font-['Public_Sans:SemiBold',_sans-serif] font-semibold leading-[0] left-[568px] text-[#2b2b2b] text-[18px] text-left text-nowrap top-[291px]">
        <p className="block leading-[normal] whitespace-pre">Contractor</p>
      </div>
      <div className="absolute bg-[#ffffff] h-[728px] left-[568px] rounded-[10px] shadow-[0px_4px_15px_0px_rgba(58,121,232,0.05)] top-[329px] w-[1130px]" />
      <Group1171276412 />
      <Group1171276411 />
      <Group1171276410 />
      <Group1171276409 />
      <Group1171276413 />
      <Group1171276422 />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[383px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[427px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[471px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[515px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[559px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[603px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[647px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[691px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[732px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[773px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[814px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[896px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[937px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[978px] w-[1086px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-[593px] opacity-10 top-[1019px] w-[1086px]" />
      <Group1171276419 />
      <div
        className="absolute box-border content-stretch flex flex-row gap-2 items-center justify-start left-[1139px] p-0 top-[1071px]"
        data-name="pagination"
      >
        <Pagination />
      </div>
      <Group1171276420 />
      <Group1171276421 />
    </div>
  );
}

function Group1171276424() {
  return (
    <div className="absolute contents left-[568px] top-[291px]">
      <Group1171276423 />
    </div>
  );
}

function Group() {
  return (
    <div
      className="absolute bottom-[95.094%] left-[77.22%] right-[21.787%] top-[2.709%]"
      data-name="Group"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 17 21"
      >
        <g id="Group">
          <path
            d={svgPaths.p2468f4f0}
            fill="var(--fill-0, #2B2B2B)"
            id="Vector"
          />
          <path
            d={svgPaths.p1777a380}
            fill="var(--fill-0, #2B2B2B)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p2d283f00}
            fill="var(--fill-0, #2B2B2B)"
            id="Vector_3"
          />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div
      className="absolute bottom-[95.094%] contents left-[77.22%] right-[21.787%] top-[2.709%]"
      data-name="Group"
    >
      <Group />
    </div>
  );
}

function Group1171276385() {
  return (
    <div className="absolute contents left-[1310px] top-[15px]">
      <div
        className="absolute left-[1310px] size-10 top-[15px]"
        data-name="image"
      >
        {/* <img
          className="block max-w-none size-full"
          height="40"
          src={imgImage}
          width="40"
        /> */}
      </div>
      <Group1 />
    </div>
  );
}

function Menu() {
  return (
    <div
      className="absolute left-[270px] size-[26px] top-[22px]"
      data-name="menu"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 26 26"
      >
        <g id="menu">
          <path
            d="M3.25 13H22.75"
            id="Vector"
            stroke="var(--stroke-0, #2B2B2B)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.16667"
          />
          <path
            d="M3.25 6.5H22.75"
            id="Vector_2"
            stroke="var(--stroke-0, #2B2B2B)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.16667"
          />
          <path
            d="M3.25 19.5H22.75"
            id="Vector_3"
            stroke="var(--stroke-0, #2B2B2B)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.16667"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame1171275925() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-[326px] pl-2.5 pr-[200px] py-2.5 rounded-[5px] top-4">
      <div className="absolute border border-[rgba(43,43,43,0.2)] border-solid inset-0 pointer-events-none rounded-[5px]" />
      <div className="font-['Public_Sans:Italic',_sans-serif] font-normal italic leading-[0] opacity-50 relative shrink-0 text-[#2b2b2b] text-[16px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Search</p>
      </div>
    </div>
  );
}

function Fi1946436() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275926() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[95px] py-3 top-[100px]">
      <Fi1946436 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Dashboard</p>
      </div>
    </div>
  );
}

function Fi1946437() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275927() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[145px] py-3 top-[154px]">
      <Fi1946437 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Jobs</p>
      </div>
    </div>
  );
}

function Fi1946438() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275928() {
  return (
    <div className="absolute bg-[#0a53d4] box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 pl-[30px] pr-[95px] py-3 top-52">
      <Fi1946438 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Contractor</p>
      </div>
    </div>
  );
}

function Fi1946439() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275929() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[135px] py-3 top-[262px]">
      <Fi1946439 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Labor</p>
      </div>
    </div>
  );
}

function Fi1946440() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275930() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[106px] py-3 top-[316px]">
      <Fi1946440 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Inventory</p>
      </div>
    </div>
  );
}

function Fi1946441() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275931() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[113px] py-3 top-[370px]">
      <Fi1946441 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Supplier</p>
      </div>
    </div>
  );
}

function Fi1946442() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275932() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[125px] py-3 top-[424px]">
      <Fi1946442 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Invoice</p>
      </div>
    </div>
  );
}

function Fi1946443() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="fi_1946436">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 19 19"
      >
        <g clipPath="url(#clip0_2051_43)" id="fi_1946436">
          <path d={svgPaths.p2dfe00} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2051_43">
            <rect fill="white" height="19" width="19" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1171275933() {
  return (
    <div className="absolute box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-0 opacity-80 pl-[30px] pr-[95px] py-3 top-[678px]">
      <Fi1946443 />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#ffffff] text-[17px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">Archive</p>
      </div>
    </div>
  );
}

function Group1000004387() {
  return (
    <div className="relative size-[39.377px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 40 40"
      >
        <g id="Group 1000004387">
          <g id="Ellipse 3258">
            <circle
              cx="19.6885"
              cy="19.6885"
              fill="var(--fill-0, white)"
              r="19.6885"
            />
            <circle
              cx="19.6885"
              cy="19.6885"
              r="19.1885"
              stroke="var(--stroke-0, #DDDDDD)"
              strokeOpacity="0.866667"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ChevronLeft() {
  return (
    <div className="relative size-6" data-name="chevron-left">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="chevron-left">
          <path
            d="M15 18L9 12L15 6"
            id="Vector"
            stroke="var(--stroke-0, #2B2B2B)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

function Group1171276376() {
  return (
    <div className="absolute contents left-[493.623px] top-[88px]">
      <div className="absolute flex items-center justify-center left-[493.623px] size-[39.377px] top-[88px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <Group1000004387 />
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[501px] size-6 top-24">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <ChevronLeft />
        </div>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <div className="relative shrink-0 size-6" data-name="chevron-down">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="chevron-down">
          <path
            d="M6 9L12 15L18 9"
            id="Vector"
            stroke="var(--stroke-0, #2B2B2B)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame1171275896() {
  return (
    <div className="absolute bg-[#ffffff] box-border content-stretch flex flex-row gap-2.5 h-10 items-center justify-center left-[260px] px-[15px] py-2.5 rounded-[10px] top-[88px]">
      <div className="absolute border border-[rgba(221,221,221,0.87)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#2b2b2b] text-[14px] text-left text-nowrap">
        <p className="block leading-[30px] whitespace-pre">Active Customers</p>
      </div>
      <ChevronDown />
    </div>
  );
}

function Frame1171275954() {
  return (
    <div className="absolute bg-[#effff2] box-border content-stretch flex flex-row gap-2.5 items-center justify-center left-[708px] px-2.5 py-[3px] rounded-[5px] top-[223px]">
      <div className="absolute border border-[#0b8d27] border-solid inset-0 pointer-events-none rounded-[5px]" />
      <div
        className="font-['DM_Sans:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#0b8d27] text-[14px] text-left text-nowrap"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] whitespace-pre">Partial Paid</p>
      </div>
    </div>
  );
}

function Group1171276428() {
  return (
    <div className="absolute contents left-[588px] top-[143px]">
      <div
        className="absolute font-['DM_Sans:Medium',_sans-serif] font-medium leading-[0] left-[588px] opacity-70 text-[#2b2b2b] text-[14px] text-left text-nowrap top-[143px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] whitespace-pre">Job ID</p>
      </div>
      <div
        className="absolute font-['DM_Sans:Medium',_sans-serif] font-medium leading-[0] left-[708px] text-[#2b2b2b] text-[14px] text-left text-nowrap top-[143px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] whitespace-pre">PH209_US_JDP</p>
      </div>
      <div
        className="absolute font-['DM_Sans:Medium',_sans-serif] font-medium leading-[0] left-[588px] opacity-70 text-[#2b2b2b] text-[14px] text-left text-nowrap top-[183px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] whitespace-pre">Billing Address</p>
      </div>
      <div
        className="absolute font-['DM_Sans:Medium',_sans-serif] font-medium leading-[0] left-[708px] text-[#2b2b2b] text-[14px] text-left text-nowrap top-[183px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] whitespace-pre">
          312 NSW 2042, Australia
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:Medium',_sans-serif] font-medium leading-[0] left-[588px] opacity-70 text-[#2b2b2b] text-[14px] text-left text-nowrap top-[226px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] whitespace-pre">Invoice Status</p>
      </div>
      <Frame1171275954 />
    </div>
  );
}

function Group1171276426() {
  return (
    <div className="absolute contents font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] left-[928px] text-[#2b2b2b] text-[14px] text-left text-nowrap top-[143px]">
      <div className="absolute left-[928px] opacity-70 top-[143px]">
        <p className="block leading-[20px] text-nowrap whitespace-pre">Email</p>
      </div>
      <div className="absolute left-[1034px] top-[143px]">
        <p className="block leading-[20px] text-nowrap whitespace-pre">
          john@gmail.com
        </p>
      </div>
    </div>
  );
}

function Group1171276425() {
  return (
    <div className="absolute contents font-medium leading-[0] left-[928px] text-[#2b2b2b] text-[14px] text-left text-nowrap top-[186px]">
      <div
        className="absolute font-['DM_Sans:Medium',_sans-serif] left-[928px] opacity-70 top-[186px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[20px] text-nowrap whitespace-pre">
          Bank Details
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] leading-[20px] left-[1034px] top-[186px] whitespace-pre">
        <p className="block mb-0">BSB No: 313 140</p>
        <p className="block">Account No: 12345678</p>
      </div>
    </div>
  );
}

function Group1171276427() {
  return (
    <div className="absolute contents left-[928px] top-[143px]">
      <Group1171276426 />
      <Group1171276425 />
    </div>
  );
}

function Carat1() {
  return (
    <div className="absolute inset-[12.5%]" data-name="carat">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="carat">
          <path
            d={svgPaths.p2866a680}
            fill="var(--fill-0, #C4CDD5)"
            id="Vector"
          />
        </g>
      </svg>
    </div>
  );
}

function Page1() {
  return (
    <div
      className="bg-[#ffffff] relative rounded shrink-0 size-8"
      data-name="page"
    >
      <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
      <Carat1 />
    </div>
  );
}

function PageActive() {
  return (
    <div
      className="absolute bg-[#ffffff] inset-0 rounded"
      data-name="page / active"
    >
      <div className="overflow-clip relative size-full">
        <div className="absolute bottom-[5px] font-['SF_Pro_Text:Bold',_sans-serif] leading-[0] left-1 not-italic right-1 text-[#0066ff] text-[14px] text-center top-[5px]">
          <p className="block leading-[20px]">1</p>
        </div>
      </div>
      <div className="absolute border border-[#0066ff] border-solid inset-0 pointer-events-none rounded" />
    </div>
  );
}

function Page2() {
  return (
    <div className="relative shrink-0 size-8" data-name="page">
      <PageActive />
    </div>
  );
}

function Page3() {
  return (
    <div
      className="bg-[#ffffff] relative rounded shrink-0 size-8"
      data-name="page"
    >
      <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
      <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
        <p className="block leading-[20px]">2</p>
      </div>
    </div>
  );
}

function Page4() {
  return (
    <div
      className="bg-[#ffffff] relative rounded shrink-0 size-8"
      data-name="page"
    >
      <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
      <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
        <p className="block leading-[20px]">...</p>
      </div>
    </div>
  );
}

function Page5() {
  return (
    <div
      className="bg-[#ffffff] relative rounded shrink-0 size-8"
      data-name="page"
    >
      <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
      <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
        <p className="block leading-[20px]">9</p>
      </div>
    </div>
  );
}

function Page6() {
  return (
    <div
      className="bg-[#ffffff] relative rounded shrink-0 size-8"
      data-name="page"
    >
      <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
      <div className="absolute bottom-[5px] font-['Inter:Bold',_sans-serif] font-bold leading-[0] left-1 not-italic right-1 text-[#2b2b2b] text-[14px] text-center top-[5px]">
        <p className="block leading-[20px]">10</p>
      </div>
    </div>
  );
}

function Carat3() {
  return (
    <div className="absolute inset-[12.5%]" data-name="carat">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="carat">
          <path
            d={svgPaths.p275bda00}
            fill="var(--fill-0, #C4CDD5)"
            id="Vector"
          />
        </g>
      </svg>
    </div>
  );
}

function Page7() {
  return (
    <div
      className="bg-[#ffffff] relative rounded shrink-0 size-8"
      data-name="page"
    >
      <div className="absolute border border-[#dfe3e8] border-solid inset-0 pointer-events-none rounded" />
      <Carat3 />
    </div>
  );
}

function Pagination1() {
  return (
    <div
      className="absolute box-border content-stretch flex flex-row gap-2 items-center justify-start left-[1146px] p-0 top-[870px]"
      data-name="pagination"
    >
      <Page1 />
      <Page2 />
      <Page3 />
      <Page4 />
      <Page5 />
      <Page6 />
      <Page7 />
    </div>
  );
}

export default function Contractor1() {
  return (
    <div className="bg-[#f6f8fb] relative size-full" data-name="Contractor 1">
      <Group1171276424 />
      <div className="absolute bg-[#3a79e8] h-[1024px] left-0 top-0 w-60" />
      <div className="absolute bg-[#ffffff] h-[181px] left-[568px] rounded-[10px] shadow-[0px_4px_15px_0px_rgba(58,121,232,0.05)] top-[90px] w-[832px]" />
      <div
        className="absolute bg-[#ffffff] h-[70px] top-0 translate-x-[-50%] w-[1200px]"
        style={{ left: "calc(50% - 16px)" }}
      />
      <div
        className="absolute left-[1370px] size-10 top-[15px]"
        data-name="image"
      >
        {/* <img
          className="block max-w-none size-full"
          height="40"
          src={imgImage1}
          width="40"
        /> */}
      </div>
      <Group1171276385 />
      <Menu />
      <Frame1171275925 />
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[33.697px] left-[30px] top-[19px] w-[90px]"
        data-name="logo_1111 1"
         
      />
      <Frame1171275926 />
      <Frame1171275927 />
      <Frame1171275928 />
      <Frame1171275929 />
      <Frame1171275930 />
      <Frame1171275931 />
      <Frame1171275932 />
      <Frame1171275933 />
      <div
        className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold leading-[0] left-[277px] text-[#161616] text-[24px] text-left text-nowrap top-[147px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="block leading-[30px] whitespace-pre">Contractor</p>
      </div>
      <div
        className="absolute bg-[#ffffff] h-[856px] left-60 shadow-[0px_4px_15px_0px_rgba(58,121,232,0.05)] top-[70px] w-[308px]"
        data-name="young-woman-car-mechanic-checking-car-car-service"
      />
      <div className="absolute bg-[#ffffff] h-[30px] left-60 top-[926px] w-[308px]">
        <div className="absolute border border-[#dddddd] border-solid inset-0 pointer-events-none" />
      </div>
      <Group1171276376 />
      <div className="absolute font-['Public_Sans:SemiBold',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[132px]">
        <p className="leading-[30px] whitespace-pre">
          <span className="text-[16px]">{`John Carter  `}</span>
          <span className="font-['Public_Sans:Regular',_sans-serif] font-normal text-[14px] text-[rgba(43,43,43,0.7)]">
            (Contractor)
          </span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#009a00] text-[0px] text-left text-nowrap top-[173px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 1160 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] left-[474px] text-[#009a00] text-[13px] text-left text-nowrap top-[173px]">
        <p className="block leading-[20px] whitespace-pre">Complete</p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[202px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 11613 W Shores RD NW Jursa Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[665px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 11613 W Shores RD NW Jursa Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#161616] text-[0px] text-left text-nowrap top-[899px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 11613 W Shores RD NW Jursa Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[406px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` Niedermeyer Gil`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[232px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2805 Maplewood Cir E palladino`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[696px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2805 Maplewood Cir E palladino`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#161616] text-[0px] text-left text-nowrap top-[931px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2805 Maplewood Cir E palladino`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[435px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 1365 Brackets Point Rd, Wayzata`}</span>
        </p>
      </div>
      <div className="absolute bg-[#ffffff] h-[30px] left-60 top-[955px] w-[308px]">
        <div className="absolute border border-[#dddddd] border-solid inset-0 pointer-events-none" />
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[260px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2805 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[725px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2805 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#161616] text-[0px] text-left text-nowrap top-[960px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2805 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[464px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2165 North Shore Drive`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#e2a500] text-[0px] text-left text-nowrap top-[289px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 4211 Aiden Dr Frakes Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[493px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 2450 Island Dr. Spring Park`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[319px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 6149 CR 13 Batzer Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[752px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 6149 CR 13 Batzer Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[609px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 6149 CR 13 Batzer Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[580px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 1160 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#ff0000] text-[0px] text-left text-nowrap top-[841px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 6149 CR 13 Batzer Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[522px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 1160 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[347px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 709 Tyrol Tr Tousignant Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[783px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 709 Tyrol Tr Tousignant Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[638px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 709 Tyrol Tr Tousignant Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[872px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 709 Tyrol Tr Tousignant Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[276px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[551px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` 1160 N Willow Dr Near Res.`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[376px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` New Job`}</span>
        </p>
      </div>
      <div
        className="absolute font-['DM_Sans:SemiBold',_'Noto_Sans:Regular',_sans-serif] font-semibold leading-[0] left-[260px] text-[#2b2b2b] text-[0px] text-left text-nowrap top-[810px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        <p className="font-['Public_Sans:Regular',_'Noto_Sans:Regular',_sans-serif] font-normal leading-[20px] whitespace-pre">
          <span className="text-[8px]">◆</span>
          <span className="text-[14px]">{` New Job`}</span>
        </p>
      </div>
      <Frame1171275896 />
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium leading-[0] left-[481px] text-[#e2a500] text-[13px] text-left text-nowrap top-[290px]">
        <p className="block leading-[20px] whitespace-pre">Ongoing</p>
      </div>
      <div className="absolute font-['Public_Sans:Regular',_sans-serif] font-normal leading-[0] left-[483px] text-[#ff0000] text-[13px] text-left text-nowrap top-[841px]">
        <p className="block leading-[20px] whitespace-pre">Pending</p>
      </div>
      <div
        className="absolute flex h-[5px] items-center justify-center right-[546.5px] translate-y-[-50%] w-[76px]"
        style={{ top: "calc(50% + 453.5px)" }}
      >
        <div className="flex-none rotate-[270deg]">
          <div className="bg-[#000000] h-[76px] opacity-60 rounded-[10px] w-[5px]" />
        </div>
      </div>
      <div className="absolute bg-[#009a00] h-px left-60 top-[197px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[227px] w-[308px]" />
      <div className="absolute bg-[#009a00] h-px left-60 top-[168px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-64 w-[308px]" />
      <div className="absolute bg-[#e2a500] h-px left-60 top-[285px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[372px] w-[308px]" />
      <div className="absolute bg-[#e2a500] h-px left-60 top-[314px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[401px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[343px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[430px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[459px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[546px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[633px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[720px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[807px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[488px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[575px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[662px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[749px] w-[308px]" />
      <div className="absolute bg-[#ff0000] h-px left-60 opacity-10 top-[836px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[894px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[517px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[604px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[691px] w-[308px]" />
      <div className="absolute bg-[#2b2b2b] h-px left-60 opacity-10 top-[778px] w-[308px]" />
      <div className="absolute bg-[#ff0000] h-px left-60 opacity-10 top-[865px] w-[308px]" />
      <div className="absolute font-['Public_Sans:SemiBold',_sans-serif] font-semibold leading-[0] left-[588px] text-[#2b2b2b] text-[18px] text-left text-nowrap top-[102px]">
        <p className="block leading-[normal] whitespace-pre">Job Information</p>
      </div>
      <Group1171276428 />
      <div className="absolute font-['Public_Sans:Medium',_sans-serif] font-medium leading-[30px] left-[1256px] text-[#3a79e8] text-[14px] text-left text-nowrap top-[143px] whitespace-pre">
        <p className="block mb-0">Quick Report</p>
        <p className="block">Invoice Download</p>
      </div>
      <Group1171276427 />
      <div className="absolute bg-[#d9d9d9] h-[116px] left-[902px] opacity-60 top-[133px] w-px" />
      <div className="absolute bg-[#d9d9d9] h-[116px] left-[1230px] opacity-60 top-[133px] w-px" />
      <div className="absolute bg-[#f6f8fb] bottom-0 h-[71px] right-0 w-[1144px]" />
      <Pagination1 />
    </div>
  );
}