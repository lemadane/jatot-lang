package io.jatot.intellij

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

object JatotFileType : LanguageFileType(JatotLanguage) {
    override fun getName(): String = "Jatot"
    override fun getDescription(): String = "Jatot source file"
    override fun getDefaultExtension(): String = "jatot"
    override fun getIcon(): Icon? = null
}
