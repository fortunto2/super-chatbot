"use client";

import type { ForwardedRef } from "react";
import {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    ListsToggle,
    Separator,
    codeBlockPlugin,
    InsertCodeBlock,
    codeMirrorPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import styles from "./styles.module.scss";
import { cn } from "@/lib/utils";

export const MarkdownEditor = ({
    editorRef,
    ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) => {
    return (
        <div className="w-full">
            <MDXEditor
                {...props}
                ref={editorRef}
                contentEditableClassName={cn("prose ", styles.editor)}
                plugins={[
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <InsertCodeBlock />
                                <UndoRedo />
                                <Separator />
                                <BoldItalicUnderlineToggles />
                                <ListsToggle />
                                <Separator />
                                <BlockTypeSelect />

                                {/* <CreateLink />
                <InsertImage /> */}
                            </>
                        ),
                    }),

                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    // linkDialogPlugin(),
                    // linkPlugin(),
                    thematicBreakPlugin(),

                    codeBlockPlugin({
                        defaultCodeBlockLanguage: "txt",
                    }),
                    codeMirrorPlugin({
                        codeBlockLanguages: {
                            json: "json",
                            txt: "text",
                        },
                    }),
                    markdownShortcutPlugin(),
                ]}
            />
        </div>
    );
};
