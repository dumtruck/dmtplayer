/*
 * This file is part of FFmpeg.
 *
 * FFmpeg is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * FFmpeg is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with FFmpeg; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */

#ifndef FFTOOLS_FOPEN_UTF8_H
#define FFTOOLS_FOPEN_UTF8_H

#include <stdio.h>

/* The fopen_utf8 function here is essentially equivalent to avpriv_fopen_utf8,
 * except that it doesn't set O_CLOEXEC, and that it isn't exported
 * from a different library. (On Windows, each DLL might use a different
 * CRT, and FILE* handles can't be shared across them.) */

static inline FILE *fopen_utf8(const char *path, const char *mode) {
  return fopen(path, mode);
}

#endif /* FFTOOLS_FOPEN_UTF8_H */
