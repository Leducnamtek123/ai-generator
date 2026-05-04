const fs = require('fs');
const file = 'src/components/workflow/nodes/MediaNode.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<Upload className={cn("text-muted-foreground", data.isPreview ? "w-4 h-4" : "w-8 h-8")} />`;

const replacement = `<>
                                    <Upload className={cn("text-muted-foreground", data.isPreview ? "w-4 h-4" : "w-8 h-8 mb-2")} />
                                    {!data.isPreview && <span className="text-xs text-muted-foreground font-medium">Upload media</span>}
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleInputChange}
                                accept={acceptTypes[mediaType]}
                                className="hidden"
                            />
                            {false && (
                                <span />`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Fixed MediaNode.tsx');
