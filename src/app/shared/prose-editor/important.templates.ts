// important.templates.ts
export const IMPORTANT_HTML_BASE = `
<article style="display:flex; width:95%; max-width:750px; min-width:200px; padding:12px 0px 35px 5px;">
  <div style="
      position:relative;
      width:100%;
      background:#fddaaf;
      background:-moz-linear-gradient(left, #fddaaf 0%, #fece93 0%, #fece93 15%, #ff9a21 30%, #ff9a21 59%, #fece93 70%, #fece93 73%, #fddaaf 100%);
      background:-webkit-linear-gradient(left, #fddaaf 0%, #fece93 0%, #fece93 15%, #ff9a21 30%, #ff9a21 59%, #fece93 70%, #fece93 73%, #fddaaf 100%);
      background:linear-gradient(to right, #fddaaf 0%, #fece93 0%, #fece93 15%, #ff9a21 30%, #ff9a21 59%, #fece93 70%, #fece93 73%, #fddaaf 100%);
      border-radius:5px 0 5px 5px;
    ">
    <div style="border-top:15px solid #c76c00; border-left:64px solid transparent; position:absolute; left:4px; bottom:-15px;">
      <div style="clip-path:polygon(0 54%, 0% 101%, 106% 72%); background:#a6611c; width:38px; height:63px; position:absolute; right:0; bottom:-16px;"></div>
    </div>

    <div style="clip-path:polygon(0 0, 0 12%, 100% 12%); width:50px; height:93px; background:#a6611c; position:absolute; right:0; top:-11px;"></div>

    <section style="top:3px; padding:8px; position:relative;">
      <div class="csa-custom-scroll" style="
          -webkit-box-orient:vertical;
          box-sizing:border-box;
          color:black;
          direction:rtl;
          display:-webkit-box;
          margin:0;
          max-height:60px;
          min-height:30px;
          overflow-y:auto;
          padding-right:3px;
          scroll-behavior:smooth;
          text-overflow:ellipsis;
          transform:rotate(180deg);
        ">
        <code style="
            color:#000;
            direction:ltr;
            display:inline-block;
            margin:0;
            min-height:30px;
            padding:0;
            text-align:left;
            transform:rotate(180deg);
            padding-bottom:5px;
          ">
          <span data-slot="content"></span>
        </code>
      </div>
    </section>
  </div>
</article>
`;
