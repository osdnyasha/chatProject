define(['Base/Component', 'Comp/Header'], function (Component, Header) {
'use strict';

    /**
     * класс страницы
     */
    class Page extends Component {
        render({title, description='', content='', contentOptions={}}) {
            let contentRender;
            if (typeof(content) === 'string' ) {
                contentRender = content;
            } else {
                contentRender = this.childrens.create(content, contentOptions)
            }

            return `<div class="wraper">
                    ${this.childrens.create(Header, {
                        title,
                        description
                    })}
                    <div class="content">
                        ${contentRender}
                    </div>
                </div>`;
        }
    }

    return Page;
});